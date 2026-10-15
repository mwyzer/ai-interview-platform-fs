# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PortfolioGeneratorWorker do
  it 'skips quietly when the session no longer exists' do
    expect { described_class.new.perform(-1) }.not_to raise_error
  end

  it 'runs the generator for the session' do
    session   = create(:session, :ended)
    generator = instance_double(Portfolios::Generator, call: nil)
    allow(Portfolios::Generator).to receive(:new).with(session:).and_return(generator)

    described_class.new.perform(session.id)

    expect(generator).to have_received(:call)
  end

  it 'marks the portfolio failed once Sidekiq gives up retrying' do
    portfolio = create(:portfolio, generation_status: 'generating')
    message   = { 'args' => [portfolio.session_id], 'retry_count' => 3, 'error_message' => 'Gemini API timeout' }

    described_class.sidekiq_retries_exhausted_block.call(message, StandardError.new)

    expect(portfolio.reload).to have_attributes(
      generation_status: 'failed', generation_error: 'Failed after 3 retries: Gemini API timeout'
    )
  end
end
