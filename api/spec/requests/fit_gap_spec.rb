# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Fit/gap reports', type: :request do
  let(:organization) { create(:organization) }
  let(:assessment)   { create(:assessment, organization:) }
  let(:session)      { create(:session, :ended, assessment:) }
  let(:portfolio)    { create(:portfolio, session:) }
  let(:vacancy)      { create(:vacancy, organization:) }
  let(:headers)      { auth_headers_for(organization) }

  def request_fitgap
    post "/api/v1/portfolios/#{portfolio.id}/fitgap", params: { fitgap: { vacancy_id: vacancy.id } }.to_json, headers:
  end

  it 'queues generation and answers 202 when no report exists yet' do
    request_fitgap

    expect(response).to have_http_status(:accepted)
    expect(FitGapGeneratorWorker.jobs.map { |j| j['args'] }).to eq([[portfolio.id, vacancy.id]])
  end

  it 'returns the stored report without queueing another job' do
    create(:fit_gap_report, portfolio:, vacancy:)

    request_fitgap

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('report', 'skill_comparisons', 0, 'result')).to eq('match')
    expect(FitGapGeneratorWorker.jobs).to be_empty
  end

  it 'refuses to compare a portfolio that is not complete' do
    portfolio.update!(generation_status: 'generating')

    request_fitgap

    expect(response).to have_http_status(:unprocessable_entity)
    expect(FitGapGeneratorWorker.jobs).to be_empty
  end

  it 'requires a vacancy' do
    post "/api/v1/portfolios/#{portfolio.id}/fitgap", params: {}.to_json, headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
  end

  it 'P1-6: queues only one job while a report is already being generated (known defect)' do
    pending 'P1-6: every request while generating enqueues another job'

    request_fitgap
    request_fitgap

    expect(FitGapGeneratorWorker.jobs.size).to eq(1)
  end
end
