# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ProductionGuards do
  let(:ready) { { 'GEMINI_TIER' => 'paid', 'LOGIN_TENANT_SCHEME' => 'acme' } }

  it 'lets production start on the paid tier with a server-set company' do
    expect(described_class.problems(ready)).to be_empty
    expect { described_class.check!(ready) }.not_to raise_error
  end

  it 'refuses the free tier, or no tier at all' do
    [ready.merge('GEMINI_TIER' => 'free'), ready.except('GEMINI_TIER')].each do |env|
      expect { described_class.check!(env) }.to raise_error(/GEMINI_TIER must be 'paid'/)
    end
  end

  it 'refuses to start without a server-set company' do
    [ready.except('LOGIN_TENANT_SCHEME'), ready.merge('LOGIN_TENANT_SCHEME' => '  ')].each do |env|
      expect { described_class.check!(env) }.to raise_error(/LOGIN_TENANT_SCHEME must name/)
    end
  end

  it 'names every problem at once, so one deploy fixes them all' do
    expect(described_class.problems({}).size).to eq(2)
  end
end
