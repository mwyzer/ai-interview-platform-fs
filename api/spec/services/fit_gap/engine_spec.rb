# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FitGap::Engine do
  let(:organization) { create(:organization) }
  let(:assessment)   { create(:assessment, organization:) }
  let(:session)      { create(:session, :ended, assessment:) }
  let(:portfolio)    { create(:portfolio, session:) }
  let(:vacancy)      { create(:vacancy, organization:) }
  let(:narrative)    { { 'culture_narrative' => 'Culture text.', 'overall_narrative' => 'Overall text.' } }

  def run(response = narrative)
    described_class.new(portfolio:, vacancy:, gemini_client: FakeGemini.new(response)).call
  end

  def comparison_for(report, label)
    report.skill_comparisons.find { |c| c['skill_label'] == label }
  end

  describe 'skill comparisons' do
    before do
      create(:vacancy_skill, vacancy:, skill_id: 'SK-ENG-001', skill_label: 'React', expected_level: 3)
      create(:vacancy_skill, vacancy:, skill_id: 'SK-SOFT-001', skill_label: 'Communication', expected_level: 3)
      create(:vacancy_skill, vacancy:, skill_id: 'SK-ENG-003', skill_label: 'System Design', expected_level: 2)
      create(:vacancy_skill, vacancy:, skill_id: nil, skill_label: 'Kubernetes', expected_level: 2)

      create(:portfolio_skill, portfolio:, skill_id: 'SK-ENG-001', skill_label: 'React', ai_level: 3)
      create(:portfolio_skill, portfolio:, skill_id: 'SK-SOFT-001', skill_label: 'Communication', ai_level: 2)
      create(:portfolio_skill, portfolio:, skill_id: 'SK-ENG-003', skill_label: 'System Design', ai_level: 3)
    end

    it 'classifies match, gap, exceed and not assessed with the level delta' do
      report = run

      expect(comparison_for(report, 'React')).to include('result' => 'match', 'delta' => 0)
      expect(comparison_for(report, 'Communication')).to include('result' => 'gap', 'delta' => -1)
      expect(comparison_for(report, 'System Design')).to include('result' => 'exceed', 'delta' => 1)
      expect(comparison_for(report, 'Kubernetes')).to include('result' => 'not_assessed', 'candidate_level' => nil)
    end

    it "uses the assessor's override instead of the AI level" do
      communication = portfolio.portfolio_skills.find_by!(skill_label: 'Communication')
      create(:assessor_override, portfolio_skill: communication, override_level: 3)

      expect(comparison_for(run, 'Communication')).to include('result' => 'match', 'candidate_level' => 3)
    end

    it 'matches by skill_id first, then by label ignoring case' do
      portfolio.portfolio_skills.find_by!(skill_label: 'React').update!(skill_label: 'React / Frontend')
      create(:portfolio_skill, portfolio:, skill_id: nil, skill_label: 'KUBERNETES', ai_level: 2)

      report = run

      expect(comparison_for(report, 'React')).to include('result' => 'match')
      expect(comparison_for(report, 'Kubernetes')).to include('result' => 'match')
    end
  end

  describe 'narratives' do
    before { create(:vacancy_skill, vacancy:, skill_label: 'React', expected_level: 3) }

    it 'stores the narratives returned by the model' do
      expect(run).to have_attributes(culture_narrative: 'Culture text.', overall_narrative: 'Overall text.')
    end

    it 'falls back to a counted summary when the model call fails' do
      report = run(Gemini::HttpClient::ApiError.new('API returned 503'))

      expect(report.culture_narrative).to be_nil
      expect(report.overall_narrative).to start_with('Candidate shows 0 skill matches')
    end
  end

  it 'updates the existing report for the same portfolio and vacancy instead of adding one' do
    create(:vacancy_skill, vacancy:, skill_label: 'React', expected_level: 3)

    run
    run

    expect(FitGapReport.where(portfolio:, vacancy:).count).to eq(1)
  end

  describe 'known defects (Step 3)' do
    it 'P1-1: reports a skill the interview never reached as not assessed, not as a gap' do
      pending 'P0-1/P1-1: an unrated skill reaches fit/gap as a fabricated L1'

      assessment_with_skills = create(:assessment, :with_skills, organization:)
      ended = create(:session, :ended, assessment: assessment_with_skills)
      create(:transcript_turn, session: ended, text: 'We profiled with React DevTools.')
      create(:vacancy_skill, vacancy:, skill_id: 'SK-SOFT-001', skill_label: 'Communication', expected_level: 3)

      model_output = {
        'configured_skills' => [{ 'skill_id' => 'SK-SOFT-001', 'skill_label' => 'Communication', 'level' => nil,
                                  'confidence' => 'low', 'evidence' => [], 'competency_summary' => 'Not assessed.' }]
      }
      generated = Portfolios::Generator.new(session: ended, gemini_client: FakeGemini.new(model_output)).call

      report = described_class.new(portfolio: generated, vacancy:, gemini_client: FakeGemini.new(narrative)).call

      expect(comparison_for(report, 'Communication')['result']).to eq('not_assessed')
    end
  end
end
