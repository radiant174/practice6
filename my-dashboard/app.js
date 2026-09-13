const state = { data: null, filter: '全部' };
let barChart = null;
let pieChart = null;

const loadData = async () => {
  $('#retry').hide();
  $('#status').removeClass('alert-danger').addClass('alert-warning').text('加载中...').show();
  try {
    const response = await fetch('data/campus.json');
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    if (data.venues.length === 0) {
      $('#status').text('暂无数据').show();
      return;
    }
    state.data = data;
    $('#sub-title').text(data.title + ' · ' + data.period + ' · 数据来源：' + data.source);
    $('#status').hide();
    renderFilters(data);
    renderCards();
    renderBarChart();
    renderPieChart();
  } catch (error) {
    $('#status').removeClass('alert-warning').addClass('alert-danger')
      .text('加载失败：' + error.message).show();
    $('#retry').show();
  }
};

const visibleVenues = () => {
  if (state.filter === '全部') {
    return state.data.venues;
  }
  return state.data.venues.filter(v => v.type === state.filter);
};

const totalOf = (venue) => venue.usage.reduce((sum, n) => sum + n, 0);

const renderFilters = (data) => {
  const types = ['全部'];
  data.venues.forEach(v => {
    if (!types.includes(v.type)) {
      types.push(v.type);
    }
  });
  $('#filters').empty();
  types.forEach(t => {
    const active = t === state.filter ? ' active' : '';
    $('#filters').append(`<button type="button" class="btn btn-outline-primary${active}" data-type="${t}">${t}</button>`);
  });
};

const renderCards = () => {
  const data = state.data;
  const venues = visibleVenues();
  const grandTotal = venues.reduce((sum, v) => sum + totalOf(v), 0);
  $('#cards').empty();
  venues.forEach(v => {
    const total = totalOf(v);
    const share = grandTotal === 0 ? 0 : (total / grandTotal * 100).toFixed(1);
    $('#cards').append(`
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h3 class="card-title h6">${v.name}<span class="badge text-bg-light ms-2">${v.type}</span></h3>
            <p class="card-text fs-4">${total} <span class="fs-6 text-muted">${data.unit}</span></p>
            <p class="card-text small text-muted">共${data.months.length}个月累计 · 占筛选总量 ${share}%</p>
          </div>
        </div>
      </div>
    `);
  });
};

const renderBarChart = () => {
  const data = state.data;
  const venues = visibleVenues();
  if (barChart === null) {
    barChart = echarts.init(document.querySelector('#bar-chart'));
  }
  barChart.setOption({
    title: {
      text: '各场地使用总量（单位：人次）',
      subtext: '数据来源：' + data.source,
      left: 'center'
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 70, right: 30, top: 100, bottom: 40 },
    xAxis: { data: venues.map(v => v.name) },
    yAxis: { name: '人次', min: 0 },
    series: [{
      name: '使用总量',
      type: 'bar',
      barMaxWidth: 56,
      data: venues.map(v => totalOf(v))
    }]
  });
};

const renderPieChart = () => {
  const data = state.data;
  const venues = visibleVenues();
  if (pieChart === null) {
    pieChart = echarts.init(document.querySelector('#pie-chart'));
  }
  pieChart.setOption({
    title: {
      text: '各场地使用占比',
      subtext: '数据来源：' + data.source,
      left: 'center'
    },
    tooltip: { trigger: 'item' },
    series: [{
      name: '使用占比',
      type: 'pie',
      radius: '52%',
      center: ['50%', '62%'],
      data: venues.map(v => ({ value: totalOf(v), name: v.name })),
      label: { formatter: '{b}: {d}%' }
    }]
  });
};

loadData();
