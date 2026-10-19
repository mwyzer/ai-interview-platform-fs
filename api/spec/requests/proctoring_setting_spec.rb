# frozen_string_literal: true

require 'rails_helper'

# Proctoring (camera and full-screen share kept on during the interview) is set per assessment, off by default, so
# today's voice-only interviews, phones included, keep working. The candidate page reads it from the invite link.
RSpec.describe 'The proctoring setting', type: :request do
  let(:organization) { create(:organization) }
  let(:assessment)   { create(:assessment, organization:) }
  let(:headers)      { auth_headers_for(organization) }
  let(:session)      { create(:session, assessment:) }

  before { allow(SystemPromptGeneratorWorker).to receive(:perform_async) }

  it 'is off unless the assessor turns it on' do
    get "/api/v1/assessments/#{assessment.id}", headers: headers
    expect(json.dig('assessment', 'proctoring_required')).to be(false)

    get "/api/v1/sessions/#{session.invite_token}/candidate"
    expect(json['proctoring_required']).to be(false)
  end

  it 'turns on per assessment and reaches the candidate page' do
    put "/api/v1/assessments/#{assessment.id}",
        params: { assessment: { name: assessment.name, proctoring_required: true } }.to_json, headers: headers

    expect(response).to have_http_status(:ok)
    expect(json.dig('assessment', 'proctoring_required')).to be(true)

    get "/api/v1/sessions/#{session.invite_token}/candidate"
    expect(json['proctoring_required']).to be(true)
  end
end
