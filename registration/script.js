/**
 * LIFF 初期登録画面
 */

// 設定
const LIFF_ID = '2008916754-BE3VwmAg';
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzbjFxjplSSHR57GUp2rzeEciYqAeUA_cxeQjcAUsfoWyrRBKbXKS5AqW5BrJnWhpVJcw/exec';

// 品目リスト（アイコン付き）
const CROPS = [
  { id: 'lettuce', name: 'レタス', icon: '🥬' },
  { id: 'cabbage', name: 'キャベツ', icon: '🥬' },
  { id: 'tomato', name: 'トマト', icon: '🍅' },
  { id: 'cucumber', name: 'きゅうり', icon: '🥒' },
  { id: 'hakusai', name: '白菜', icon: '🥬' },
  { id: 'daikon', name: '大根', icon: '🥕' },
  { id: 'nasu', name: 'なす', icon: '🍆' },
  { id: 'piman', name: 'ピーマン', icon: '🫑' },
  { id: 'negi', name: 'ねぎ', icon: '🧅' },
  { id: 'hourensou', name: 'ほうれん草', icon: '🥬' },
  { id: 'rice', name: '米', icon: '🌾' }
];

// 都道府県リスト
const PREFECTURES = [
  { id: 'hokkaido', name: '北海道' },
  { id: 'aomori', name: '青森県' },
  { id: 'iwate', name: '岩手県' },
  { id: 'miyagi', name: '宮城県' },
  { id: 'akita', name: '秋田県' },
  { id: 'yamagata', name: '山形県' },
  { id: 'fukushima', name: '福島県' },
  { id: 'ibaraki', name: '茨城県' },
  { id: 'tochigi', name: '栃木県' },
  { id: 'gunma', name: '群馬県' },
  { id: 'saitama', name: '埼玉県' },
  { id: 'chiba', name: '千葉県' },
  { id: 'tokyo', name: '東京都' },
  { id: 'kanagawa', name: '神奈川県' },
  { id: 'niigata', name: '新潟県' },
  { id: 'toyama', name: '富山県' },
  { id: 'ishikawa', name: '石川県' },
  { id: 'fukui', name: '福井県' },
  { id: 'yamanashi', name: '山梨県' },
  { id: 'nagano', name: '長野県' },
  { id: 'gifu', name: '岐阜県' },
  { id: 'shizuoka', name: '静岡県' },
  { id: 'aichi', name: '愛知県' },
  { id: 'mie', name: '三重県' },
  { id: 'shiga', name: '滋賀県' },
  { id: 'kyoto', name: '京都府' },
  { id: 'osaka', name: '大阪府' },
  { id: 'hyogo', name: '兵庫県' },
  { id: 'nara', name: '奈良県' },
  { id: 'wakayama', name: '和歌山県' },
  { id: 'tottori', name: '鳥取県' },
  { id: 'shimane', name: '島根県' },
  { id: 'okayama', name: '岡山県' },
  { id: 'hiroshima', name: '広島県' },
  { id: 'yamaguchi', name: '山口県' },
  { id: 'tokushima', name: '徳島県' },
  { id: 'kagawa', name: '香川県' },
  { id: 'ehime', name: '愛媛県' },
  { id: 'kochi', name: '高知県' },
  { id: 'fukuoka', name: '福岡県' },
  { id: 'saga', name: '佐賀県' },
  { id: 'nagasaki', name: '長崎県' },
  { id: 'kumamoto', name: '熊本県' },
  { id: 'oita', name: '大分県' },
  { id: 'miyazaki', name: '宮崎県' },
  { id: 'kagoshima', name: '鹿児島県' },
  { id: 'okinawa', name: '沖縄県' }
];

// 状態管理
let selectedCrops = [];
let selectedPrefecture = '';
let userId = null;

/**
 * 初期化
 */
async function init() {
  showLoading(true);

  try {
    // LIFF初期化
    await liff.init({ liffId: LIFF_ID });

    // ログインチェック
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // ユーザーID取得
    const profile = await liff.getProfile();
    userId = profile.userId;

    // 既存の登録情報を取得
    await loadExistingData();

    // UIを初期化
    initCropGrid();
    initPrefectureSelect();

  } catch (error) {
    console.error('初期化エラー:', error);
    alert('エラーが発生しました。再度お試しください。');
  } finally {
    showLoading(false);
  }
}

/**
 * 既存の登録情報を取得
 */
async function loadExistingData() {
  try {
    const response = await fetch(`${GAS_API_URL}?action=getUser&userId=${userId}`);
    const user = await response.json();

    if (user && user.crops) {
      selectedCrops = user.crops;
    }
    if (user && user.prefecture) {
      selectedPrefecture = user.prefecture;
    }
  } catch (error) {
    console.log('既存データなし');
  }
}

/**
 * 品目グリッドを初期化
 */
function initCropGrid() {
  const grid = document.getElementById('cropGrid');
  grid.innerHTML = '';

  CROPS.forEach(crop => {
    const div = document.createElement('div');
    div.className = 'crop-item' + (selectedCrops.includes(crop.id) ? ' selected' : '');
    div.dataset.id = crop.id;
    div.innerHTML = `
      <span class="check">✓</span>
      <span class="icon">${crop.icon}</span>
      <span class="name">${crop.name}</span>
    `;
    div.onclick = () => toggleCrop(crop.id, div);
    grid.appendChild(div);
  });

  updateStep1Button();
}

/**
 * 都道府県セレクトを初期化
 */
function initPrefectureSelect() {
  const select = document.getElementById('prefectureSelect');

  PREFECTURES.forEach(pref => {
    const option = document.createElement('option');
    option.value = pref.id;
    option.textContent = pref.name;
    if (pref.id === selectedPrefecture) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.onchange = () => {
    selectedPrefecture = select.value;
    updateSubmitButton();
  };

  updateSubmitButton();
}

/**
 * 品目の選択/解除
 */
function toggleCrop(cropId, element) {
  const index = selectedCrops.indexOf(cropId);

  if (index === -1) {
    selectedCrops.push(cropId);
    element.classList.add('selected');
  } else {
    selectedCrops.splice(index, 1);
    element.classList.remove('selected');
  }

  updateStep1Button();
}

/**
 * ステップ1のボタン状態を更新
 */
function updateStep1Button() {
  const btn = document.getElementById('step1Next');
  btn.disabled = selectedCrops.length === 0;
}

/**
 * 登録ボタンの状態を更新
 */
function updateSubmitButton() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = !selectedPrefecture;
}

/**
 * 次のステップへ
 */
function nextStep(step) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');
}

/**
 * 前のステップへ
 */
function prevStep(step) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById(`step${step}`).classList.add('active');
}

/**
 * 登録を送信
 */
async function submitRegistration() {
  showLoading(true);

  try {
    // GASのAPIを呼び出して登録
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'updateUser',
        userId: userId,
        crops: selectedCrops,
        prefecture: selectedPrefecture
      })
    });

    // 完了画面に表示する情報を設定
    const cropNames = selectedCrops.map(id => {
      const crop = CROPS.find(c => c.id === id);
      return crop ? crop.name : id;
    });
    document.getElementById('summarycrops').textContent = cropNames.join('、');

    const pref = PREFECTURES.find(p => p.id === selectedPrefecture);
    document.getElementById('summaryPrefecture').textContent = pref ? pref.name : selectedPrefecture;

    // 完了画面を表示
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById('complete').classList.add('active');

    // LINEにメッセージを送信
    if (liff.isInClient()) {
      await liff.sendMessages([
        {
          type: 'text',
          text: `登録を更新しました！\n品目: ${cropNames.join('、')}\n地域: ${pref ? pref.name : selectedPrefecture}`
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
