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
end
