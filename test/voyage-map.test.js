const { test } = require('node:test');
const assert = require('node:assert');

// Mock DOM APIs for SVG
const createMockSVGElement = (tagName) => {
    const attributes = {};
    const children = [];
    return {
        tagName,
        attributes,
        children,
        setAttribute(name, value) {
            attributes[name] = value;
        },
        getAttribute(name) {
            return attributes[name];
        },
        appendChild(child) {
            children.push(child);
        },
        get textContent() {
            return attributes._textContent || '';
        },
        set textContent(value) {
            attributes._textContent = value;
        }
    };
};

// Mock document with SVG support
global.document = {
    mockElements: {},
    getElementById(id) {
        if (!this.mockElements[id]) {
            this.mockElements[id] = createMockSVGElement('div');
            this.mockElements[id].id = id;
        }
        return this.mockElements[id];
    },
    querySelector: () => createMockSVGElement('div'),
    createElement: (tag) => createMockSVGElement(tag),
    createElementNS: (ns, tag) => createMockSVGElement(tag),
    body: {
        appendChild: () => {},
        children: []
    }
};

// Mock localStorage
global.localStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    clear() {
        this.data = {};
    }
};

global.window = {
    addEventListener: () => {}
};

// Clear localStorage before loading the game module
global.localStorage.clear();

// Import game module
const game = require('../game.js');

test('港に正しい座標が定義されている', () => {
    const ports = game.ports;

    // すべての港に座標が存在することを確認
    assert.ok(ports.lisbon.x !== undefined, 'リスボンにx座標がある');
    assert.ok(ports.lisbon.y !== undefined, 'リスボンにy座標がある');
    assert.ok(ports.seville.x !== undefined, 'セビリアにx座標がある');
    assert.ok(ports.seville.y !== undefined, 'セビリアにy座標がある');
    assert.ok(ports.venice.x !== undefined, 'ヴェネツィアにx座標がある');
    assert.ok(ports.venice.y !== undefined, 'ヴェネツィアにy座標がある');
    assert.ok(ports.alexandria.x !== undefined, 'アレクサンドリアにx座標がある');
    assert.ok(ports.alexandria.y !== undefined, 'アレクサンドリアにy座標がある');
    assert.ok(ports.calicut.x !== undefined, 'カリカットにx座標がある');
    assert.ok(ports.calicut.y !== undefined, 'カリカットにy座標がある');
    assert.ok(ports.malacca.x !== undefined, 'マラッカにx座標がある');
    assert.ok(ports.malacca.y !== undefined, 'マラッカにy座標がある');
    assert.ok(ports.nagasaki.x !== undefined, '長崎にx座標がある');
    assert.ok(ports.nagasaki.y !== undefined, '長崎にy座標がある');

    // 座標が数値であることを確認
    assert.strictEqual(typeof ports.lisbon.x, 'number', 'リスボンのx座標は数値');
    assert.strictEqual(typeof ports.lisbon.y, 'number', 'リスボンのy座標は数値');

    // 座標が有効な範囲内にあることを確認 (0-1000の範囲)
    assert.ok(ports.lisbon.x >= 0 && ports.lisbon.x <= 1000, 'リスボンのx座標は有効な範囲');
    assert.ok(ports.lisbon.y >= 0 && ports.lisbon.y <= 600, 'リスボンのy座標は有効な範囲');
});

test('initializeVoyageMap が正しくビューポートを設定する', () => {
    // Reset mock elements
    global.document.mockElements = {};

    // Set up game state
    game.gameState.voyageStartPort = 'lisbon';
    game.gameState.voyageDestinationPort = 'venice';

    // Initialize voyage map
    game.initializeVoyageMap('lisbon', 'venice');

    const svg = global.document.getElementById('voyage-map');
    const viewBox = svg.getAttribute('viewBox');

    // ビューボックスが設定されていることを確認
    assert.ok(viewBox, 'ビューボックスが設定されている');

    // ビューボックスの形式が正しいことを確認 (4つの数値)
    const viewBoxValues = viewBox.split(' ').map(Number);
    assert.strictEqual(viewBoxValues.length, 4, 'ビューボックスは4つの値を持つ');
    assert.ok(!isNaN(viewBoxValues[0]), 'ビューボックスのx座標は数値');
    assert.ok(!isNaN(viewBoxValues[1]), 'ビューボックスのy座標は数値');
    assert.ok(!isNaN(viewBoxValues[2]), 'ビューボックスの幅は数値');
    assert.ok(!isNaN(viewBoxValues[3]), 'ビューボックスの高さは数値');
});

test('initializeVoyageMap が航路線を正しく設定する', () => {
    // Reset mock elements
    global.document.mockElements = {};

    // Set up game state
    game.gameState.voyageStartPort = 'lisbon';
    game.gameState.voyageDestinationPort = 'nagasaki';

    // Initialize voyage map
    game.initializeVoyageMap('lisbon', 'nagasaki');

    const routeLine = global.document.getElementById('voyage-route-line');

    // ポリラインのpoints属性が設定されていることを確認
    const points = routeLine.getAttribute('points');
    assert.ok(points, '航路線のpoints属性が設定されている');

    // pointsが正しい形式であることを確認 (カンマとスペース区切りの座標)
    const pointsList = points.split(' ');
    assert.ok(pointsList.length >= 2, '航路線に少なくとも2つのポイントがある');

    // 最初のポイントがリスボンの座標と一致することを確認
    const firstPoint = pointsList[0].split(',').map(Number);
    const ports = game.ports;
    assert.strictEqual(firstPoint[0], ports.lisbon.x, '開始x座標がリスボンの座標と一致');
    assert.strictEqual(firstPoint[1], ports.lisbon.y, '開始y座標がリスボンの座標と一致');

    // 最後のポイントが長崎の座標と一致することを確認
    const lastPoint = pointsList[pointsList.length - 1].split(',').map(Number);
    assert.strictEqual(lastPoint[0], ports.nagasaki.x, '終了x座標が長崎の座標と一致');
    assert.strictEqual(lastPoint[1], ports.nagasaki.y, '終了y座標が長崎の座標と一致');
});

test('initializeVoyageMap が船を出発地点に配置する', () => {
    // Reset mock elements
    global.document.mockElements = {};

    // Set up game state
    game.gameState.voyageStartPort = 'seville';
    game.gameState.voyageDestinationPort = 'calicut';

    // Initialize voyage map
    game.initializeVoyageMap('seville', 'calicut');

    const shipIcon = global.document.getElementById('voyage-ship-icon');

    // 船の座標が設定されていることを確認
    assert.ok(shipIcon.getAttribute('x'), '船のx座標が設定されている');
    assert.ok(shipIcon.getAttribute('y'), '船のy座標が設定されている');

    // 船の座標が出発地点と一致することを確認
    const ports = game.ports;
    assert.strictEqual(Number(shipIcon.getAttribute('x')), ports.seville.x, '船のx座標が出発地点と一致');
    assert.strictEqual(Number(shipIcon.getAttribute('y')), ports.seville.y, '船のy座標が出発地点と一致');
});

test('updateShipPosition が進捗に応じて船を移動させる', () => {
    // Reset mock elements
    global.document.mockElements = {};

    // Set up game state
    game.gameState.voyageStartPort = 'lisbon';
    game.gameState.voyageDestinationPort = 'venice';

    // Initialize voyage map
    game.initializeVoyageMap('lisbon', 'venice');

    const ports = game.ports;
    const route = game.getSeaRoute('lisbon', 'venice');
    const startX = route[0][0];
    const startY = route[0][1];
    const endX = route[route.length - 1][0];
    const endY = route[route.length - 1][1];

    // 進捗0%: 出発地点
    game.updateShipPosition(0);
    let shipIcon = global.document.getElementById('voyage-ship-icon');
    assert.strictEqual(Number(shipIcon.getAttribute('x')), startX, '進捗0%で船は出発地点にいる (x)');
    assert.strictEqual(Number(shipIcon.getAttribute('y')), startY, '進捗0%で船は出発地点にいる (y)');

    // 進捗50%: ルート上のどこかにいる（正確な座標はウェイポイントに依存）
    game.updateShipPosition(0.5);
    shipIcon = global.document.getElementById('voyage-ship-icon');
    const midX = Number(shipIcon.getAttribute('x'));
    const midY = Number(shipIcon.getAttribute('y'));
    // 中間地点はルートの範囲内にある（ウェイポイントを考慮）
    const routeMinX = Math.min(...route.map(p => p[0]));
    const routeMaxX = Math.max(...route.map(p => p[0]));
    const routeMinY = Math.min(...route.map(p => p[1]));
    const routeMaxY = Math.max(...route.map(p => p[1]));
    assert.ok(midX >= routeMinX && midX <= routeMaxX, '進捗50%で船はルート上にいる (x)');
    assert.ok(midY >= routeMinY && midY <= routeMaxY, '進捗50%で船はルート上にいる (y)');

    // 進捗100%: 目的地
    game.updateShipPosition(1.0);
    shipIcon = global.document.getElementById('voyage-ship-icon');
    assert.strictEqual(Number(shipIcon.getAttribute('x')), endX, '進捗100%で船は目的地にいる (x)');
    assert.strictEqual(Number(shipIcon.getAttribute('y')), endY, '進捗100%で船は目的地にいる (y)');
});

test('近い港同士のビューポートは適切にズームされる', () => {
    // Reset mock elements
    global.document.mockElements = {};

    // Set up game state for nearby ports (lisbon -> seville)
    game.gameState.voyageStartPort = 'lisbon';
    game.gameState.voyageDestinationPort = 'seville';

    // Initialize voyage map
    game.initializeVoyageMap('lisbon', 'seville');

    const svg = global.document.getElementById('voyage-map');
    const viewBox = svg.getAttribute('viewBox');
    const viewBoxValues = viewBox.split(' ').map(Number);
    const viewBoxWidth = viewBoxValues[2];
    const viewBoxHeight = viewBoxValues[3];

    // 近い港同士なので、ビューポートの幅は地図全体より小さいはず
    assert.ok(viewBoxWidth < 1000 || viewBoxHeight < 600, '近い港同士のビューポートはズームされている');
});

test('遠い港同士のビューポートは広範囲をカバーする', () => {
    // Reset mock elements
    global.document.mockElements = {};

    // Set up game state for distant ports (lisbon -> nagasaki)
    game.gameState.voyageStartPort = 'lisbon';
    game.gameState.voyageDestinationPort = 'nagasaki';

    // Initialize voyage map
    game.initializeVoyageMap('lisbon', 'nagasaki');

    const svg = global.document.getElementById('voyage-map');
    const viewBox = svg.getAttribute('viewBox');
    const viewBoxValues = viewBox.split(' ').map(Number);
    const viewBoxWidth = viewBoxValues[2];
    const viewBoxHeight = viewBoxValues[3];

    // 遠い港同士なので、ビューポートは広範囲をカバーするはず
    // ただし、最大値は1000x600に制限される
    assert.ok(viewBoxWidth >= 200, '遠い港同士のビューポートは広い (幅)');
    assert.ok(viewBoxHeight >= 100, '遠い港同士のビューポートは広い (高さ)');
});

console.log('All voyage map tests completed!');
