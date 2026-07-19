const samplePosts = [
  {
    id: "rainy-night",
    type: "selection",
    label: "映画5選",
    title: "雨の夜に観たい映画5選",
    lead: "静かな夜に、余韻が長く残る映画を集めました。",
    color: "#3f6f8f",
    image: "assets/rainy-night.svg",
    items: [
      { title: "言の葉の庭", note: "雨の新宿御苑で出会う二人の距離感が美しい作品。", detail: "雨音と短い会話が、言えない気持ちをやわらかく見せます。", image: "assets/kotonoha.svg", colors: ["#6aa1a8", "#203949"] },
      { title: "シェイプ・オブ・ウォーター", note: "孤独な人たちが手を伸ばす、幻想的なラブストーリー。", detail: "水のイメージが、言葉にならない愛情を包みます。", image: "assets/water.svg", colors: ["#1d7f76", "#142f3a"] },
      { title: "ミッドナイト・イン・パリ", note: "雨上がりのパリを歩きたくなる、軽やかな時間旅行。", detail: "理想の時代に憧れる気持ちと、今を生きることが重なります。", image: "assets/paris.svg", colors: ["#c89b4e", "#38406b"] },
      { title: "花束みたいな恋をした", note: "好きなものが同じ二人の、現実に近い恋の記録。", detail: "日常の細部が、関係の変化を静かに映します。", image: "assets/bouquet.svg", colors: ["#e2a1a1", "#62585c"] },
      { title: "アバウト・タイム", note: "明日を少し大切にしたくなる、やさしい人生映画。", detail: "特別な日より、何気ない一日を選び直す物語です。", image: "assets/about-time.svg", colors: ["#bf5142", "#263f59"] },
    ],
  },
];

let posts = JSON.parse(localStorage.getItem("movie-picks-posts") || "null") || samplePosts;

const postGrid = document.querySelector("#postGrid");
const postPreview = document.querySelector("#postPreview");
const dialog = document.querySelector("#detailDialog");
const dialogContent = document.querySelector("#dialogContent");
const searchInput = document.querySelector("#searchInput");
const searchGrid = document.querySelector("#searchGrid");
const feedView = document.querySelector("#feed");
const searchView = document.querySelector("#search");
const createView = document.querySelector("#create");
const openCreateBtn = document.querySelector("#openCreateBtn");
const backToFeedBtn = document.querySelector("#backToFeedBtn");
const navButtons = [...document.querySelectorAll(".nav-tabs [data-view]")];

function savePosts() {
  localStorage.setItem("movie-picks-posts", JSON.stringify(posts));
}

function showView(viewName) {
  const views = {
    feed: feedView,
    search: searchView,
    create: createView,
  };

  Object.entries(views).forEach(([name, view]) => {
    const isActive = name === viewName;
    view.classList.toggle("is-active", isActive);
    view.hidden = !isActive;
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });

  if (viewName === "search") {
    searchInput?.focus();
    renderSearchGrid(searchInput?.value || "");
  }

  if (viewName === "create") {
    renderPostPreview();
  }
}

function resizeAndConvertToBase64(file, callback) {
  const reader = new FileReader();
  reader.onerror = function (err) { console.error("FileReader error:", err); };
  reader.onload = function (e) {
    const img = new Image();
    img.onerror = function (err) { console.error("Image loading error:", err); };
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
      callback(compressedDataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function renderPosts(query = "") {
  const search = String(query || "").trim().toLowerCase();
  const visiblePosts = search ? posts.filter((post) => matchesSearch(post, search)) : posts;

  postGrid.innerHTML = visiblePosts.map((post) => renderPost(post)).join("");
}

function renderPreviewPost(post) {
  return `
    <article class="post-card">
      <div class="carousel" aria-label="${escapeHtml(post.title)}のプレビュー">
        <section class="slide cover-slide">
          <div class="poster-art" style="${makeCoverStyle(post)}">
            <span class="post-type" style="position: absolute; top: 1.1rem; left: 1.1rem; margin-bottom: 0;">${post.label}</span>
            <span class="poster-title" style="font-size: clamp(1.4rem, 5vw, 1.85rem); line-height: 1.2;">${escapeHtml(post.title)}</span>
          </div>
          <div class="slide-copy">
            <p style="margin-bottom: 0; color: var(--muted); line-height: 1.7;">${escapeHtml(post.lead)}</p>
          </div>
          <div class="slide-actions">
            <span class="dot-count">1 / ${post.items.length + 1}</span>
            <span style="color: var(--accent-2); font-size: 0.86rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.25rem; animation: bounceX 1.5s infinite;">スワイプして見る →</span>
          </div>
        </section>
        ${post.items.map((item, index) => renderSlide(post, item, index)).join("")}
      </div>
    </article>
  `;
}

function renderPostPreview() {
  if (!postPreview) return;
  const form = document.querySelector("#postForm");
  if (!form) return;
  const draft = getDraftPost(form);
  postPreview.innerHTML = renderPreviewPost(draft);
}

function getDraftPost(form) {
  const formData = new FormData(form);
  const movieItems = collectMovieItems();
  const fallbackItems = [
    { title: "映画タイトル", note: "ここにおすすめ理由が入ります", image: "assets/rainy-night.svg", detail: "詳細ページ用の説明を書けます" },
  ];

  return {
    id: `draft-${Date.now()}`,
    label: "おすすめ映画",
    title: String(formData.get("postTitle")).trim() || "タイトル未入力",
    lead: String(formData.get("postLead")).trim() || "ここに投稿の要約が入ります。",
    color: String(formData.get("accentColor")) || "#d84f45",
    image: String(formData.get("imageUrl")).trim() || movieItems[0]?.image || "",
    items: (movieItems.length ? movieItems : fallbackItems).slice(0, 10).map((item, index) => ({
      title: item.title || `映画 ${index + 1}`,
      note: item.note || "あとから紹介文を足せます",
      image: item.image,
      detail: item.detail || `${item.note || "この映画"} 詳細ページでは、作品情報や見どころを長めに載せられます。`,
      colors: makeColors(String(formData.get("accentColor")) || "#d84f45", index),
    })),
  };
}

function renderSearchGrid(query = "") {
  const search = String(query || "").trim().toLowerCase();
  const visiblePosts = search ? posts.filter((post) => matchesSearch(post, search)) : posts;

  searchGrid.innerHTML = visiblePosts.slice(0, 81).map(renderSearchThumb).join("");
}

function renderSearchThumb(post) {
  const colors = makeColors(post.color, 0);
  const style = makeImageStyle(post.image || post.items[0]?.image || "", colors);
  return `
    <button class="search-thumb" type="button" style="${style}" data-detail="${post.id}" data-index="0">
      <span>${escapeHtml(post.title)}</span>
    </button>
  `;
}

function matchesSearch(post, search) {
  const fields = [post.title, post.lead];
  if (fields.some((value) => String(value || "").toLowerCase().includes(search))) {
    return true;
  }

  return post.items.some((item) => {
    return [item.title, item.note, item.detail].some((value) => String(value || "").toLowerCase().includes(search));
  });
}

function renderPost(post) {
  return `
    <article class="post-card">
      <button class="delete-post-btn" data-delete-post="${post.id}" aria-label="投稿を削除">×</button>
      <div class="carousel" aria-label="${escapeHtml(post.title)}のスライド">
        <section class="slide cover-slide">
          <div class="poster-art" style="${makeCoverStyle(post)}">
            <span class="post-type" style="position: absolute; top: 1.1rem; left: 1.1rem; margin-bottom: 0;">${post.label}</span>
            <span class="poster-title" style="font-size: clamp(1.4rem, 5vw, 1.85rem); line-height: 1.2;">${escapeHtml(post.title)}</span>
          </div>
          <div class="slide-copy">
            <p style="margin-bottom: 0; color: var(--muted); line-height: 1.7;">${escapeHtml(post.lead)}</p>
          </div>
          <div class="slide-actions">
            <span class="dot-count">1 / ${post.items.length + 1}</span>
            <span style="color: var(--accent-2); font-size: 0.86rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.25rem; animation: bounceX 1.5s infinite;">スワイプして見る →</span>
          </div>
        </section>
        ${post.items.map((item, index) => renderSlide(post, item, index)).join("")}
      </div>
    </article>
  `;
}

function renderSlide(post, item, index) {
  const colors = item.colors || makeColors(post.color, index);
  return `
    <section class="slide">
      <button class="poster-art" style="${makePosterStyle(item.image || post.image, colors)}" data-detail="${post.id}" data-index="${index}">
        <span class="poster-title">${escapeHtml(item.title)}</span>
      </button>
      <div class="slide-copy">
        <strong>${index + 1}. ${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.note)}</p>
      </div>
      <div class="slide-actions">
        <span class="dot-count">${index + 2} / ${post.items.length + 1}</span>
        <button class="detail-btn" data-detail="${post.id}" data-index="${index}">詳しく見る</button>
      </div>
    </section>
  `;
}

function openDetail(postId, itemIndex) {
  const post = posts.find((entry) => entry.id === postId);
  const item = post?.items[itemIndex];
  if (!post || !item) return;
  const colors = item.colors || makeColors(post.color, itemIndex);

  dialogContent.innerHTML = `
    <div class="dialog-hero" style="${makeCoverStyle(post)}">
      <span class="post-type">${post.label}</span>
      <h2>${escapeHtml(item.title)}</h2>
    </div>
    <div class="dialog-body">
      <div class="detail-image" style="${makeImageStyle(item.image || post.image, colors)}" role="img" aria-label="${escapeHtml(item.title)}の画像"></div>
      <p>${escapeHtml(post.lead)}</p>
      <div class="detail-list">
        <div class="detail-row"><strong>投稿内の紹介文</strong><span>${escapeHtml(item.note)}</span></div>
        <div class="detail-row"><strong>詳しいポイント</strong><span>${escapeHtml(item.detail || item.note)}</span></div>
      </div>
    </div>
  `;
  dialog.showModal();
}

function makePostFromForm(form) {
  const formData = new FormData(form);
  const movieItems = collectMovieItems();
  const fallbackItems = [
    { title: "映画タイトル", note: "ここにおすすめ理由が入ります", image: "assets/rainy-night.svg", detail: "詳細ページ用の説明を書けます" },
  ];

  return {
    id: `post-${Date.now()}`,
    label: "おすすめ映画",
    title: String(formData.get("postTitle")).trim(),
    lead: String(formData.get("postLead")).trim() || "テンプレから追加した投稿です。",
    color: String(formData.get("accentColor")),
    image: String(formData.get("imageUrl")).trim() || movieItems[0]?.image || "",
    items: (movieItems.length ? movieItems : fallbackItems).slice(0, 10).map((item, index) => ({
      title: item.title || `映画 ${index + 1}`,
      note: item.note || "あとから紹介文を足せます",
      image: item.image,
      detail: item.detail || `${item.note || "この映画"} 詳細ページでは、作品情報や見どころを長めに載せられます。`,
      colors: makeColors(String(formData.get("accentColor")), index),
    })),
  };
}

function initMovieEditor() {
  const editor = document.querySelector("#movieItemsEditor");
  if (!editor) return;
  editor.innerHTML = "";
  const starter = [
    { title: "", note: "", image: "assets/rainy-night.svg", detail: "" }
  ];
  starter.forEach((item) => editor.appendChild(createMovieEditorItem(item)));
  updateMovieNumbers();
}

function createMovieEditorItem(item = {}) {
  const row = document.createElement("article");
  row.className = "movie-editor-item";
  const previewStyle = item.image ? `background-image: url('${item.image}')` : '';
  const previewText = item.image ? '' : '未選択';
  row.innerHTML = `
    <div class="movie-editor-top">
      <span class="movie-editor-number"></span>
      <button class="icon-btn remove-movie-btn" type="button" aria-label="この映画を削除">×</button>
    </div>
    <div class="field"><label>映画名</label><input class="movie-title-input" placeholder="例：ラ・ラ・ランド" value="${escapeAttribute(item.title || "")}" /></div>
    <div class="field"><label>紹介文</label><textarea class="movie-note-input" rows="2" placeholder="投稿カードに出る短い説明">${escapeHtml(item.note || "")}</textarea></div>
    <div class="field">
      <label>画像</label>
      <div class="file-input-wrapper">
        <span class="file-input-btn">
          画像を選択する
          <input type="file" class="movie-image-file" accept="image/*" />
        </span>
        <input type="hidden" class="movie-image-url" value="${escapeAttribute(item.image || "")}" />
        <div class="file-input-preview movie-image-preview" style="${previewStyle}">${previewText}</div>
      </div>
    </div>
    <div class="field"><label>詳細文</label><textarea class="movie-detail-input" rows="3" placeholder="タップ後の詳細画面に出る説明">${escapeHtml(item.detail || "")}</textarea></div>
  `;
  return row;
}

function collectMovieItems() {
  return [...document.querySelectorAll(".movie-editor-item")]
    .map((row) => ({
      title: row.querySelector(".movie-title-input").value.trim(),
      note: row.querySelector(".movie-note-input").value.trim(),
      image: row.querySelector(".movie-image-url").value.trim(),
      detail: row.querySelector(".movie-detail-input").value.trim(),
    }))
    .filter((item) => item.title || item.note || item.image || item.detail);
}

function updateMovieNumbers() {
  document.querySelectorAll(".movie-editor-item").forEach((row, index) => {
    row.querySelector(".movie-editor-number").textContent = `Movie ${index + 1}`;
  });
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function makeCoverStyle(post) {
  const x = post.imagePosition?.x ?? 50;
  const y = post.imagePosition?.y ?? 50;
  return `--cover-color:${post.color};${post.image ? `background-image:linear-gradient(135deg, rgba(0,0,0,.24), rgba(0,0,0,.5)),url('${cssEscapeUrl(post.image)}');background-position:${x}% ${y}%;` : ""}`;
}

function makePosterStyle(image, colors) {
  return `--poster-a:${colors[0]};--poster-b:${colors[1]};${image ? `background-image:linear-gradient(160deg, rgba(0,0,0,.08), rgba(0,0,0,.52)),url('${cssEscapeUrl(image)}');` : ""}`;
}

function makeImageStyle(image, colors) {
  return `--poster-a:${colors[0]};--poster-b:${colors[1]};${image ? `background-image:linear-gradient(160deg, rgba(0,0,0,.05), rgba(0,0,0,.22)),url('${cssEscapeUrl(image)}');` : ""}`;
}

function makeColors(baseColor, index) {
  const palette = [[baseColor, "#263238"], ["#c76d43", "#3c465d"], ["#517f6f", "#24342f"], ["#8464a0", "#313144"], ["#c19a4a", "#34445a"]];
  return palette[index % palette.length];
}

function cssEscapeUrl(value) {
  return String(value).replaceAll('"', "%22").replaceAll("\\", "%5C");
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

openCreateBtn?.addEventListener("click", () => {
  showView("create");
  document.querySelector("#postTitle").focus();
});

backToFeedBtn.addEventListener("click", () => {
  showView("feed");
  document.querySelector("#feed").scrollIntoView({ behavior: "smooth", block: "start" });
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

document.addEventListener("click", (event) => {
  const deletePostBtn = event.target.closest("[data-delete-post]");
  if (deletePostBtn) {
    event.stopPropagation();
    const postId = deletePostBtn.dataset.deletePost;
    const post = posts.find((entry) => entry.id === postId);
    if (post && confirm(`「${post.title}」を削除しますか？`)) {
      posts = posts.filter((entry) => entry.id !== postId);
      savePosts();
      renderPosts();
    }
    return;
  }

  const addMovieButton = event.target.closest("#addMovieBtn");
  if (addMovieButton) {
    document.querySelector("#movieItemsEditor").appendChild(createMovieEditorItem());
    updateMovieNumbers();
    renderPostPreview();
  }

  const removeMovieButton = event.target.closest(".remove-movie-btn");
  if (removeMovieButton) {
    const items = document.querySelectorAll(".movie-editor-item");
    if (items.length > 1) {
      removeMovieButton.closest(".movie-editor-item").remove();
      updateMovieNumbers();
      renderPostPreview();
    }
  }

  const detailTrigger = event.target.closest("[data-detail]");
  if (detailTrigger) openDetail(detailTrigger.dataset.detail, Number(detailTrigger.dataset.index));
});

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());

document.querySelector("#searchForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSearchGrid(searchInput?.value);
});

document.querySelector("#searchInput")?.addEventListener("input", (event) => {
  renderSearchGrid(event.target.value);
});

document.querySelector("#postForm")?.addEventListener("input", () => {
  renderPostPreview();
});

document.addEventListener("change", (event) => {
  const coverFileSel = event.target.closest("#coverImageFile");
  if (coverFileSel && coverFileSel.files && coverFileSel.files[0]) {
    const file = coverFileSel.files[0];
    resizeAndConvertToBase64(file, (base64) => {
      document.querySelector("#imageUrl").value = base64;
    });
  }

  const movieFileSel = event.target.closest(".movie-image-file");
  if (movieFileSel && movieFileSel.files && movieFileSel.files[0]) {
    const file = movieFileSel.files[0];
    const itemRow = movieFileSel.closest(".movie-editor-item");
    resizeAndConvertToBase64(file, (base64) => {
      itemRow.querySelector(".movie-image-url").value = base64;
      const preview = itemRow.querySelector(".movie-image-preview");
      preview.style.backgroundImage = `url('${base64}')`;
      preview.textContent = '';
    });
  }
});

document.querySelector("#postForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const newPost = makePostFromForm(event.currentTarget);
  posts = [newPost, ...posts];
  savePosts();
  renderPosts();
  event.currentTarget.reset();
  initMovieEditor();
  renderPostPreview();
  showView("feed");
  document.querySelector("#feed").scrollIntoView({ behavior: "smooth", block: "start" });
});

showView("feed");
initMovieEditor();
renderPostPreview();
renderPosts();
