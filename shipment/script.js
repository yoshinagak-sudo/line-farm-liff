/**
 * LIFF 出荷予定登録画面
 */

// 設定
const LIFF_ID = '2008916754-BE3VwmAg';
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzbjFxjplSSHR57GUp2rzeEciYqAeUA_cxeQjcAUsfoWyrRBKbXKS5AqW5BrJnWhpVJcw/exec';

// 品目リスト
const CROPS = [
  { id: 'lettuce', name: 'レタス' },
  { id: 'cabbage', name: 'キャベツ' },
  { id: 'tomato', name: 'トマト' },
  { id: 'cucumber', name: 'きゅうり' },
  { id: 'hakusai', name: '白菜' },
  { id: 'daikon', name: '大根' },
  { id: 'nasu', name: 'なす' },
  { id: 'piman', name: 'ピーマン' },
  { id: 'negi', name: 'ねぎ' },
  { id: 'hourensou', name: 'ほうれん草' },
  { id: 'rice', name: '米' }
];

let userId = null;
let userCrops = [];

/**
 * 初期化
 */
async function init() {
  showLoading(true);

  try {
    // LIFF初期化
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // ユーザー情報取得
    const profile = await liff.getProfile();
    userId = profile.userId;

    // ユーザーの登録品目を取得
    await loadUserCrops();

    // UIを初期化
    initCropSelect();
    initDatePicker();

    // 既存の出荷予定を読み込み
    await loadExistingShipments();

  } catch (error) {
    console.error('初期化エラー:', error);
    alert('エラーが発生しました。再度お試しください。');
  } finally {
    showLoading(false);
  }
}

/**
 * ユーザーの登録品目を取得
 */
async function loadUserCrops() {
  try {
    const response = await fetch(`${GAS_API_URL}?action=getUser&userId=${userId}`);
    const user = await response.json();

    if (user && user.crops && user.crops.length > 0) {
      userCrops = user.crops;
    } else {
      // 登録品目がない場合は全品目を表示
      userCrops = CROPS.map(c => c.id);
    }
  } catch (error) {
    console.log('ユーザー情報取得エラー:', error);
    userCrops = CROPS.map(c => c.id);
  }
}

/**
 * 品目セレクトを初期化
 */
function initCropSelect() {
  const select = document.getElementById('cropSelect');

  // ユーザーが登録している品目のみ表示
  CROPS.filter(crop => userCrops.includes(crop.id)).forEach(crop => {
    const option = document.createElement('option');
    option.value = crop.id;
    option.textContent = crop.name;
    select.appendChild(option);
  });
}

/**
 * 日付ピッカーを初期化
 */
function initDatePicker() {
  const dateInput = document.getElementById('shipmentDate');

  // 最小日付：明後日（前日締切のため）
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 2);

  // 最大日付：2週間後
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  dateInput.min = formatDate(minDate);
  dateInput.max = formatDate(maxDate);
  dateInput.value = formatDate(minDate);
}

/**
 * 日付をフォーマット（YYYY-MM-DD）
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 日付を表示用にフォーマット
 */
function formatDateDisplay(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日(${weekday})`;
}

/**
 * 既存の出荷予定を読み込み
 */
async function loadExistingShipments() {
  try {
    const response = await fetch(`${GAS_API_URL}?action=getUserShipments&userId=${userId}`);
    const shipments = await response.json();

    renderShipmentList(shipments);
  } catch (error) {
    console.log('出荷予定取得エラー:', error);
  }
}

/**
 * 出荷予定一覧を描画
 */
function renderShipmentList(shipments) {
  const listEl = document.getElementById('shipmentList');

  if (!shipments || shipments.length === 0) {
    listEl.innerHTML = '<p class="empty">登録済みの出荷予定はありません</p>';
    return;
  }

  listEl.innerHTML = shipments.map(shipment => {
    const crop = CROPS.find(c => c.id === shipment.crop);
    const cropName = crop ? crop.name : shipment.crop;

    return `
      <div class="shipment-item" data-id="${shipment.id}">
        <div class="shipment-info">
          <div class="date">${formatDateDisplay(shipment.date)}</div>
          <div class="detail">${cropName} ${shipment.quantity}${shipment.unit}</div>
        </div>
        <div class="shipment-actions">
          <button class="btn-small cancel" onclick="cancelShipment('${shipment.id}')">取消</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 出荷予定を登録
 */
async function submitShipment() {
  const cropId = document.getElementById('cropSelect').value;
  const quantity = document.getElementById('quantity').value;
  const unit = document.getElementById('unit').value;
  const date = document.getElementById('shipmentDate').value;
  const preferredTime = document.getElementById('preferredTime').value;
  const note = document.getElementById('note').value;

  // バリデーション
  if (!cropId || !quantity || !date) {
    alert('必須項目を入力してください');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'registerShipment',
        userId: userId,
        shipment: {
          crop: cropId,
          quantity: parseInt(quantity),
          unit: unit,
          date: date,
          preferredTime: preferredTime,
          note: note
        }
      })
    });

    // 完了画面に情報を設定
    const crop = CROPS.find(c => c.id === cropId);
    document.getElementById('summaryCrop').textContent = crop ? crop.name : cropId;
    document.getElementById('summaryQuantity').textContent = `${quantity}${unit}`;
    document.getElementById('summaryDate').textContent = formatDateDisplay(date);

    // 完了画面を表示
    document.getElementById('form').classList.remove('active');
    document.getElementById('complete').classList.add('active');

    // LINEにメッセージを送信
    if (liff.isInClient()) {
      await liff.sendMessages([
        {
          type: 'text',
          text: `出荷予定を登録しました\n📦 ${crop ? crop.name : cropId} ${quantity}${unit}\n📅 ${formatDateDisplay(date)}`
        }
      ]);
    }

  } catch (error) {
    console.error('登録エラー:', error);
    alert('登録に失敗しました。再度お試しください。');
  } finally {
    showLoading(false);
  }
}

/**
 * 出荷予定をキャンセル
 */
async function cancelShipment(shipmentId) {
  if (!confirm('この出荷予定をキャンセルしますか？')) {
    return;
  }

  showLoading(true);

  try {
    await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'cancelShipment',
        userId: userId,
        shipmentId: shipmentId
      })
    });

    // 一覧を再読み込み
    await loadExistingShipments();

    // LINEにメッセージを送信
    if (liff.isInClient()) {
      await liff.sendMessages([
        {
          type: 'text',
          text: '出荷予定をキャンセルしました'
        }
      ]);
    }

  } catch (error) {
    console.error('キャンセルエラー:', error);
    alert('キャンセルに失敗しました。');
  } finally {
    showLoading(false);
  }
}

/**
 * フォームをリセット
 */
function resetForm() {
  document.getElementById('shipmentForm').reset();
  initDatePicker();

  document.getElementById('complete').classList.remove('active');
  document.getElementById('form').classList.add('active');

  // 一覧を再読み込み
  loadExistingShipments();
}

/**
 * LIFFを閉じる
 */
function closeLiff() {
  if (liff.isInClient()) {
    liff.closeWindow();
  } else {
    window.close();
  }
}

/**
 * ローディング表示
 */
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.add('show');
  } else {
    loading.classList.remove('show');
  }
}

// 初期化実行
document.addEventListener('DOMContentLoaded', init);
