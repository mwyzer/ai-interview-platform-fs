# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Session do
  it 'generates an unguessable 64-character invite token on create' do
    session = create(:session)

    expect(session.invite_token).to match(/\A\h{64}\z/)
  end

  it 'keeps invite tokens unique' do
    first = create(:session)

    duplicate = build(:session, invite_token: first.invite_token)

    expect(duplicate).not_to be_valid
  end

  it 'rejects unknown statuses and end reasons' do
    expect(build(:session, status: 'paused')).not_to be_valid
    expect(build(:session, end_reason: 'boredom')).not_to be_valid
  end

  describe 'tenant scoping' do
    it 'returns only the current tenant rows once a tenant is set' do
      mine   = create(:session)
      theirs = create(:session)

      RequestStore.store[:tenant_id] = mine.tenant_id

      expect(described_class.all).to contain_exactly(mine)
      expect(described_class.unscoped).to include(theirs)
    end

    it 'fills tenant_id from the current tenant on create' do
      organization = create(:organization)
      RequestStore.store[:tenant_id] = organization.id

      assessment = Assessment.create!(name: 'Role', time_limit_min: 30, created_by: 1)

      expect(assessment.tenant_id).to eq(organization.id)
    end
  end

  describe '#invite_url' do
    # Sets APP_BASE_URL (nil removes it) for the block and puts back whatever application.yml had.
    def with_base_url(value)
      original = ENV.fetch('APP_BASE_URL', nil)
      value.nil? ? ENV.delete('APP_BASE_URL') : ENV['APP_BASE_URL'] = value
      yield
    ensure
      original.nil? ? ENV.delete('APP_BASE_URL') : ENV['APP_BASE_URL'] = original
    end

    let(:session) { create(:session) }

    it 'opens the interview page of the web app named by APP_BASE_URL' do
      with_base_url('https://interview.example.com') do
        expect(session.invite_url).to eq("https://interview.example.com/interview/#{session.invite_token}")
      end
    end

    describe 'known defect (P1-15)' do
      it 'points at the web app, not the API, when APP_BASE_URL is unset' do
        pending 'P1-15: the default is the API (localhost:3001), which has no /interview route'

        with_base_url(nil) do
          expect(session.invite_url).to eq("http://localhost:5173/interview/#{session.invite_token}")
        end
      end

      it 'gives one slash when APP_BASE_URL ends with one' do
        pending 'P1-15: a trailing slash in APP_BASE_URL gives //interview/'

        with_base_url('https://interview.example.com/') do
          expect(session.invite_url).to eq("https://interview.example.com/interview/#{session.invite_token}")
        end
      end
    end
  end
end
