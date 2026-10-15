# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PortfolioSkill do
  it 'accepts levels 1 to 5 and the three confidence values' do
    (1..5).each { |level| expect(build(:portfolio_skill, ai_level: level)).to be_valid }
    %w[high medium low].each { |c| expect(build(:portfolio_skill, ai_confidence: c)).to be_valid }
  end

  it 'rejects levels outside 1 to 5' do
    expect(build(:portfolio_skill, ai_level: 0)).not_to be_valid
    expect(build(:portfolio_skill, ai_level: 6)).not_to be_valid
  end

  it 'rejects confidence values with the wrong case' do
    expect(build(:portfolio_skill, ai_confidence: 'High')).not_to be_valid
  end

  it 'requires a competency summary' do
    expect(build(:portfolio_skill, competency_summary: '')).not_to be_valid
  end

  it 'always returns evidence as an array' do
    expect(build(:portfolio_skill, evidence: nil).evidence_quotes).to eq([])
  end
end
