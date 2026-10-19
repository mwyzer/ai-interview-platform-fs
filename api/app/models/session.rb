# frozen_string_literal: true

class Session < ApplicationRecord
  include TenantScoped

  STATUSES   = %w[pending active ended failed].freeze
  END_REASONS = %w[manual_candidate manual_assessor all_covered time_ceiling error].freeze

  belongs_to :assessment
  has_many :transcript_turns, dependent: :destroy
  has_many :coverage_maps, dependent: :destroy
  has_one  :portfolio, dependent: :destroy

  validates :invite_token, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validates :end_reason, inclusion: { in: END_REASONS }, allow_nil: true

  before_validation :generate_invite_token, on: :create

  scope :active,  -> { where(status: 'active') }
  scope :pending, -> { where(status: 'pending') }
  scope :ended,   -> { where(status: 'ended') }

  def active?  = status == 'active'
  def ended?   = status == 'ended'
  def pending? = status == 'pending'

  # What the candidate page may report during a proctored interview. The browser is the candidate's, so anything else
  # is ignored, and the list is capped so a misbehaving page can't grow the row without limit.
  PROCTORING_EVENTS = %w[camera_stopped camera_resumed screen_stopped screen_resumed].freeze
  MAX_PROCTORING_EVENTS = 200

  def record_proctoring_event!(event, at: Time.current)
    return false unless PROCTORING_EVENTS.include?(event)
    return false if proctoring_events.size >= MAX_PROCTORING_EVENTS

    update_columns(proctoring_events: proctoring_events + [{ 'event' => event, 'at' => at.iso8601 }])
  end

  # Per device, how many times it stopped and for how long in total. A repeated stop counts once; a stop that never
  # resumed runs to the end of the interview (or to now, while it's still going).
  def proctoring_summary
    %w[camera screen].index_with do |device|
      stops = 0
      off = 0.0
      since = nil
      proctoring_events.each do |e|
        next unless e['event'].start_with?("#{device}_")

        at = Time.zone.parse(e['at'])
        if e['event'].end_with?('_stopped')
          next if since

          stops += 1
          since = at
        elsif since
          off += at - since
          since = nil
        end
      end
      off += (ended_at || Time.current) - since if since
      { stops:, off_seconds: off.round }
    end
  end

  # The candidate opens this in the web app (InterviewPage), so the base is the web app's URL, not the API's.
  def invite_url
    base = ENV.fetch('APP_BASE_URL', 'http://localhost:5173').chomp('/')
    "#{base}/interview/#{invite_token}"
  end

  private

  def generate_invite_token
    self.invite_token ||= SecureRandom.hex(32)
  end
end
