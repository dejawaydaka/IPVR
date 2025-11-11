(() => {
  const FALLBACK_PRICING = [
    {
      name: 'Real Estate',
      slug: 'real-estate',
      category: 'Property portfolios',
      minAmount: 50,
      maxAmount: 499,
      dailyPercent: 0.02,
      duration: 7,
      description: 'Real estate pricing involves valuing properties based on various factors such as location, size, condition, amenities, and market demand. Common pricing strategies include comparative market analysis (comparing the property to similar ones in the area), income approach (evaluating the property\'s income potential), and cost approach (estimating the cost to replace the property).',
      highlights: [
        'Benchmark assets against comparable properties in prime locations.',
        'Balance income, cost, and market approaches for valuation discipline.',
        'Monitor demand signals to time acquisitions and exits effectively.'
      ]
    },
    {
      name: 'Equities/Stocks',
      slug: 'equities-stocks',
      category: 'Market instruments',
      minAmount: 500,
      maxAmount: 999,
      dailyPercent: 0.025,
      duration: 7,
      description: 'Pricing of equities or stocks is primarily determined by supply and demand in the stock market. Factors influencing stock prices include company performance, economic indicators, industry trends, and investor sentiment. Stock prices are often determined by the market through a continuous auction process on stock exchanges.',
      highlights: [
        'React to market supply-and-demand shifts in real time.',
        'Track company fundamentals alongside macroeconomic indicators.',
        'Use exchange-driven price discovery to capture momentum opportunities.'
      ]
    },
    {
      name: 'Agriculture',
      slug: 'agriculture',
      category: 'Agro investments',
      minAmount: 1000,
      maxAmount: 1999,
      dailyPercent: 0.03,
      duration: 7,
      description: 'Agriculture pricing involves determining the value of agricultural products such as crops and livestock. Pricing can be influenced by factors such as crop yield, weather conditions, market demand, government policies, and international trade. Farmers often use a combination of cost-based pricing, market-based pricing, and negotiation with buyers to set prices for their products.',
      highlights: [
        'Balance yield forecasts with weather and seasonal demand patterns.',
        'Blend cost-based and market-based pricing for resilient margins.',
        'Stay responsive to policy changes and cross-border trade flows.'
      ]
    },
    {
      name: 'Air BNB',
      slug: 'air-bnb',
      category: 'Short-term rentals',
      minAmount: 2000,
      maxAmount: 3999,
      dailyPercent: 0.035,
      duration: 7,
      description: 'Airbnb pricing refers to setting rental prices for properties listed on the Airbnb platform. Hosts typically consider factors such as location, property type, amenities, seasonality, local events, and competition when determining their pricing strategy. Dynamic pricing algorithms may also be used to adjust prices based on demand and supply fluctuations.',
      highlights: [
        'Adjust nightly rates around events, seasonality, and demand spikes.',
        'Differentiate offerings with amenities and localized guest experiences.',
        'Adopt dynamic pricing tools to stay competitive in active markets.'
      ]
    },
    {
      name: 'Commodities',
      slug: 'commodities',
      category: 'Exchange-traded assets',
      minAmount: 4000,
      maxAmount: 6999,
      dailyPercent: 0.04,
      duration: 7,
      description: 'Commodities pricing involves determining the value of raw materials or primary agricultural products that are traded in bulk on commodity exchanges. Prices for commodities such as oil, gold, wheat, and coffee are influenced by factors such as supply and demand dynamics, geopolitical events, weather conditions, currency fluctuations, and global economic trends.',
      highlights: [
        'Manage exposure to global supply-and-demand shocks.',
        'Track geopolitical catalysts and currency movements closely.',
        'Leverage exchange benchmarks for transparent, real-time pricing.'
      ]
    },
    {
      name: 'Cannabis',
      slug: 'cannabis',
      category: 'Emerging markets',
      minAmount: 7000,
      maxAmount: null,
      dailyPercent: 0.05,
      duration: 7,
      description: 'Cannabis pricing refers to the pricing of cannabis products, including marijuana and hemp-derived products. Pricing strategies can vary depending on factors such as product type (e.g., flower, edibles, extracts), potency, quality, brand reputation, regulatory environment, and market demand. Pricing in the cannabis industry is still evolving due to ongoing legalization and regulation changes in various jurisdictions.',
      highlights: [
        'Align price models with evolving regulatory requirements.',
        'Segment offerings by potency, quality, and brand positioning.',
        'Respond quickly to demand shifts in fast-moving regional markets.'
      ]
    },
    {
      name: 'Retirement Plan',
      slug: 'retirement-plan',
      category: 'Long-horizon income',
      minAmount: 7000,
      maxAmount: null,
      dailyPercent: 0.05,
      duration: 7,
      description: 'Retirement planning is the process of determining your retirement income goals and the actions and decisions necessary to achieve those goals. It involves analyzing your current financial status, estimating your financial needs during retirement, and creating a strategy to reach your desired retirement lifestyle.',
      highlights: [
        'Define retirement income targets based on lifestyle aspirations.',
        'Model savings, investments, and expected cash-flow requirements.',
        'Rebalance regularly to keep long-term goals on track.'
      ]
    }
  ];

  const pricingGrid = document.getElementById('pricingGrid');

  const formatCurrency = (value) => {
    const number = Number(value || 0);
    return `$${number.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  };

  const formatRange = (min, max) => {
    if (max === null || max === undefined || !isFinite(Number(max))) {
      return `${formatCurrency(min)}+`;
    }
    return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  };

  const formatPercent = (value) => {
    const percent = Number(value || 0) * 100;
    const decimals = Number.isInteger(percent) ? 0 : 1;
    return `${percent.toFixed(decimals)}%`;
  };

  const formatDuration = (days) => {
    const value = Number(days || 0);
    return `${value} day${value === 1 ? '' : 's'}`;
  };

  const normalisePricing = (pricing) => {
    if (!Array.isArray(pricing)) {
      return [];
    }
    return pricing.map((plan, index) => {
      const fallback = FALLBACK_PRICING.find(item => item.name === plan.name) || {};
      const minAmount = plan.minAmount ?? fallback.minAmount ?? 0;
      const maxAmount = plan.maxAmount ?? fallback.maxAmount ?? null;
      const dailyPercent = plan.dailyPercent ?? fallback.dailyPercent ?? 0;
      const duration = plan.duration ?? fallback.duration ?? 7;
      const totalPercent = dailyPercent * duration;

      return {
        id: plan.id ?? index + 1,
        name: plan.name ?? fallback.name ?? `Tier ${index + 1}`,
        slug: plan.slug ?? fallback.slug ?? `tier-${index + 1}`,
        category: plan.category ?? fallback.category ?? 'Portfolio strategy',
        description: plan.description ?? fallback.description ?? '',
        highlights: Array.isArray(plan.highlights) && plan.highlights.length
          ? plan.highlights
          : (fallback.highlights ?? []),
        minAmount,
        maxAmount,
        dailyPercent,
        duration,
        totalPercent,
        rangeLabel: plan.rangeLabel ?? formatRange(minAmount, maxAmount),
        dailyReturnLabel: plan.dailyReturnLabel ?? formatPercent(dailyPercent),
        totalReturnLabel: plan.totalReturnLabel ?? formatPercent(totalPercent),
        durationLabel: plan.durationLabel ?? formatDuration(duration)
      };
    });
  };

  const sanitize = (value) => {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
  };

  const renderPricing = (pricing) => {
    if (!pricingGrid) {
      return;
    }

    if (!pricing || pricing.length === 0) {
      pricingGrid.innerHTML = `
        <div class="pricing-card loading-card">
          <div class="loading-spinner"></div>
          <p>No pricing data available right now. Please check back shortly.</p>
        </div>
      `;
      return;
    }

    pricingGrid.innerHTML = pricing.map(plan => `
      <article class="pricing-card" data-pricing="${sanitize(plan.slug)}">
        <header class="pricing-card-header">
          <span class="pricing-badge">${sanitize(plan.category)}</span>
          <h3>${sanitize(plan.name)}</h3>
        </header>
        <p class="pricing-description">
          ${sanitize(plan.description)}
        </p>
        <div class="pricing-metrics">
          <div class="pricing-metric">
            <span class="metric-label">Entry Capital</span>
            <span class="metric-value">${sanitize(plan.rangeLabel)}</span>
          </div>
          <div class="pricing-metric">
            <span class="metric-label">Daily ROI</span>
            <span class="metric-value metric-emphasis">${sanitize(plan.dailyReturnLabel)}</span>
          </div>
          <div class="pricing-metric">
            <span class="metric-label">Cycle Length</span>
            <span class="metric-value">${sanitize(plan.durationLabel)}</span>
          </div>
          <div class="pricing-metric">
            <span class="metric-label">Total Return (Cycle)</span>
            <span class="metric-value">${sanitize(plan.totalReturnLabel)}</span>
          </div>
        </div>
        ${Array.isArray(plan.highlights) && plan.highlights.length
          ? `
            <div class="pricing-highlights">
              <span class="highlights-label">Strategy Highlights</span>
              <ul>
                ${plan.highlights.map(item => `<li><i class="fas fa-check-circle"></i><span>${sanitize(item)}</span></li>`).join('')}
              </ul>
            </div>
          `
          : ''
        }
        <footer class="pricing-card-footer">
          <button class="btn btn-outline btn-small" onclick="window.location.href='dashboard/pricing.html'">
            View in Dashboard
          </button>
          <button class="btn btn-primary btn-small" onclick="window.location.href='contact.html'">
            Request Advisory
          </button>
        </footer>
      </article>
    `).join('');
  };

  const loadPricing = async () => {
    let pricing = [];
    try {
      const response = await fetch('/api/pricing', { cache: 'no-store' });
      if (response.ok) {
        const payload = await response.json();
        pricing = normalisePricing(payload?.pricing);
      }
    } catch (err) {
      console.warn('Pricing fetch failed, using fallback:', err);
    }

    if (!pricing || pricing.length === 0) {
      pricing = normalisePricing(FALLBACK_PRICING);
    }
    renderPricing(pricing);
  };

  document.addEventListener('DOMContentLoaded', loadPricing);
})();

