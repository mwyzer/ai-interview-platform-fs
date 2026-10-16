# frozen_string_literal: true

class Portfolio < ApplicationRecord
  GENERATION_STATUSES = %w[pending generating complete failed].freeze

  belongs_to :session
  has_many :portfolio_skills, dependent: :destroy
  has_many :assessor_overrides, through: :portfolio_skills

  validates :generation_status, inclusion: { in: GENERATION_STATUSES }

  # Portfolios have no tenant_id: they belong to a tenant through their session. Every request-time lookup goes
  # through this scope (Step 3, P0-2). Current.tenant_id raises when no tenant is set, so it fails closed.
  scope :for_current_tenant, -> { joins(:session).where(sessions: { tenant_id: Current.tenant_id }) }

  scope :complete,    -> { where(generation_status: 'complete') }
  scope :failed,      -> { where(generation_status: 'failed') }
  scope :generating,  -> { where(generation_status: 'generating') }

  def complete?    = generation_status == 'complete'
  def generating?  = generation_status == 'generating'
  def failed?      = generation_status == 'failed'
end
