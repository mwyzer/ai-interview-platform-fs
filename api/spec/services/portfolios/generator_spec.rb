# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Portfolios::Generator do
  let(:assessment) { create(:assessment, :with_skills) }
  let(:session)    { create(:session, :ended, assessment:) }

  let(:react_entry) do
    {
      'skill_id' => 'SK-ENG-001', 'skill_label' => 'React', 'level' => 3, 'confidence' => 'medium',
      'evidence' => ['moved hot data into useRef'], 'competency_summary' => 'Profiling-driven optimisation.'
    }
  end

  before do
    create(:transcript_turn, session:, turn_number: 1, speaker: 'ai', text: 'How did you find the slow renders?')
    create(:transcript_turn, session:, turn_number: 2, speaker: 'candidate',
                             text: 'We profiled with React DevTools and moved hot data into useRef.')
    create(:coverage_map, session:, skill_id: 'SK-ENG-001', skill_label: 'React', state: 'partial', probe_count: 2)
    create(:coverage_map, session:, skill_id: 'SK-SOFT-001', skill_label: 'Communication')
    create(:coverage_map, session:, skill_id: 'SK-ENG-003', skill_label: 'System Design')
  end

  def generate(response)
    described_class.new(session:, gemini_client: FakeGemini.new(response)).call
  end

  describe 'a successful generation' do
    it 'stores each rated skill and marks the portfolio complete' do
      portfolio = generate('configured_skills' => [react_entry], 'discovered_skills' => [])

      expect(portfolio).to have_attributes(generation_status: 'complete', generated_at: be_present)
      expect(portfolio.portfolio_skills.sole).to have_attributes(
        skill_id: 'SK-ENG-001', ai_level: 3, ai_confidence: 'medium', is_discovered: false
      )
    end

    it 'stores discovered skills separately' do
      discovered = react_entry.merge('skill_id' => nil, 'skill_label' => 'Micro-frontends', 'level' => 2, 'confidence' => 'low')

      portfolio = generate('configured_skills' => [], 'discovered_skills' => [discovered])

      expect(portfolio.portfolio_skills.sole).to have_attributes(skill_label: 'Micro-frontends', is_discovered: true)
    end

    it 'keeps at most three evidence quotes' do
      entry = react_entry.merge('evidence' => %w[a b c d e])

      expect(generate('configured_skills' => [entry]).portfolio_skills.sole.evidence).to eq(%w[a b c])
    end

    it 'replaces the previous skills when run again' do
      generate('configured_skills' => [react_entry])
      portfolio = generate('configured_skills' => [react_entry.merge('level' => 4)])

      expect(portfolio.portfolio_skills.pluck(:ai_level)).to eq([4])
    end

    it 'sends the transcript and the skill anchors to the model' do
      client = FakeGemini.new('configured_skills' => [react_entry])
      described_class.new(session:, gemini_client: client).call

      prompt = client.prompts.sole[:prompt]
      expect(prompt).to include('[CANDIDATE]: We profiled with React DevTools', 'L3 — Handles ambiguity and trade-offs.')
    end
  end

  describe 'when the model call fails' do
    it 'marks the portfolio failed with the error and re-raises for Sidekiq' do
      expect { generate(Gemini::HttpClient::TimeoutError.new('Gemini API timeout after 180s')) }
        .to raise_error(Gemini::HttpClient::TimeoutError)

      expect(session.reload.portfolio).to have_attributes(
        generation_status: 'failed', generation_error: 'Gemini API timeout after 180s'
      )
    end
  end

  # ── Known defects from assessment/03-problem-and-gap.md ─────────────────────
  # `pending` runs each example and expects it to FAIL today. When the defect is
  # fixed, RSpec reports "Expected pending ... to fail" and the marker must be removed.

  describe 'known defects (Step 3)' do
    let(:unassessed_output) do
      {
        'configured_skills' => [
          react_entry,
          { 'skill_id' => 'SK-SOFT-001', 'skill_label' => 'Communication', 'level' => nil, 'confidence' => 'low',
            'evidence' => [], 'competency_summary' => 'Not assessed.' }
        ]
      }
    end

    it 'P0-1: does not turn a skill the model could not rate into an L1 rating' do
      pending 'P0-1: level.to_i.clamp(1, 5) stores nil as L1'

      portfolio = generate(unassessed_output)

      expect(portfolio.portfolio_skills.find_by(skill_label: 'Communication')&.ai_level).to be_nil
    end

    it 'P1-3: accounts for every configured skill, even if the model leaves one out' do
      pending 'P1-3: model output is not reconciled against the configured skills'

      portfolio = generate('configured_skills' => [react_entry])

      expect(portfolio.portfolio_skills.pluck(:skill_label))
        .to match_array(['React', 'Communication', 'System Design'])
    end

    it 'P1-4: leaves no half-written portfolio when one entry is invalid' do
      pending 'P1-4: destroy_all + create! per skill runs outside a transaction'

      bad = { 'configured_skills' => [react_entry, react_entry.merge('skill_label' => 'Communication', 'confidence' => 'Low')] }

      expect { generate(bad) }.to raise_error(ActiveRecord::RecordInvalid)
      expect(session.reload.portfolio.portfolio_skills).to be_empty
    end

    it "P1-4: keeps the assessor's overrides when the portfolio is regenerated" do
      pending 'P1-4: portfolio_skills.destroy_all also destroys assessor_overrides'

      portfolio = generate('configured_skills' => [react_entry])
      create(:assessor_override, portfolio_skill: portfolio.portfolio_skills.sole, override_level: 4)

      generate('configured_skills' => [react_entry])

      expect(AssessorOverride.count).to eq(1)
    end

    it 'P1-5: drops evidence quotes that do not appear in the transcript' do
      pending 'P1-5: evidence quotes are not checked against the transcript'

      invented = react_entry.merge('evidence' => ['I led a team of 40 engineers migrating to micro-frontends'])

      expect(generate('configured_skills' => [invented]).portfolio_skills.sole.evidence).to be_empty
    end
  end
end
