# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Authentication', type: :request do
  let!(:organization) { create(:organization) }

  describe 'POST /api/v1/auth/login' do
    let!(:admin) { create(:user, email: 'assessor@example.test', password: 'correct-horse-battery') }

    def login(email, password)
      post '/api/v1/auth/login', params: { email:, password: }.to_json,
                                 headers: { 'Content-Type' => 'application/json' }
    end

    it 'returns a token scoped to an organization for valid admin credentials' do
      login('Assessor@Example.test', 'correct-horse-battery')

      expect(response).to have_http_status(:ok)
      claims = JsonWebToken.decode(response.parsed_body['token'])
      expect(claims).to include('user_id' => admin.id, 'role' => 'admin', 'scheme' => organization.scheme)
    end

    it 'rejects a wrong password with the same message as an unknown email' do
      login('assessor@example.test', 'wrong')
      wrong_password = response.parsed_body

      login('nobody@example.test', 'wrong')

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq(wrong_password)
    end

    it 'rejects users who are not admins' do
      create(:user, email: 'viewer@example.test', password: 'correct-horse-battery', role: 'user')

      login('viewer@example.test', 'correct-horse-battery')

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'protected endpoints' do
    it 'returns 401 without a token' do
      get '/api/v1/assessments', headers: { 'X-Tenant-Scheme' => organization.scheme }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 401 for a token signed with another secret' do
      forged = JWT.encode({ user_id: 1, role: 'admin', scheme: organization.scheme, exp: 1.hour.from_now.to_i },
                          'not-the-secret', 'HS256')

      get '/api/v1/assessments', headers: { 'Authorization' => "Bearer #{forged}" }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 401 for an expired token' do
      expired = JsonWebToken.encode({ user_id: 1, role: 'admin', scheme: organization.scheme, exp: 1.minute.ago.to_i })

      get '/api/v1/assessments', headers: { 'Authorization' => "Bearer #{expired}" }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 403 for a role that is not an assessor' do
      get '/api/v1/assessments', headers: auth_headers_for(organization, role: 'user')

      expect(response).to have_http_status(:forbidden)
    end

    it 'returns 200 for an admin' do
      get '/api/v1/assessments', headers: auth_headers_for(organization)

      expect(response).to have_http_status(:ok)
    end
  end

  describe 'parameter logging (P1-7, end to end in parameter_logging_spec)' do
    it 'filters passwords out of the request log' do
      filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)

      expect(filter.filter('password' => 'correct-horse-battery')['password']).to eq('[FILTERED]')
    end
  end
end
