<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listPendingSubmissions, reviewLesson } from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const submissions = ref([])
const loading = ref(true)

const userRole = userStore.user?.role ?? userStore.user?.user_metadata?.role ?? null

if (userRole !== 'admin') {
  router.replace({ name: 'home' })
}

onMounted(async () => {
  if (userRole !== 'admin') return
  const { data } = await listPendingSubmissions()
  submissions.value = data ?? []
  loading.value = false
})

async function approve(id) {
  const { error } = await reviewLesson(id, { approved: true })
  if (!error) {
    submissions.value = submissions.value.filter((s) => s.id !== id)
  }
}

async function reject(id) {
  const reason = window.prompt('请输入拒绝原因（可留空）')
  if (reason === null) return // 用户取消
  const { error } = await reviewLesson(id, { approved: false, rejectReason: reason.trim() })
  if (!error) {
    submissions.value = submissions.value.filter((s) => s.id !== id)
  }
}
</script>

<template>
  <div class="review-page">
    <div class="mb-8">
      <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 管理</p>
      <h1 class="text-2xl font-bold text-mt-text mb-1">待审核投稿</h1>
      <p class="text-xs text-mt-sub tracking-wide">审核社区用户提交的题目</p>
    </div>

    <div v-if="userRole !== 'admin'" class="access-denied">
      无权限访问此页面
    </div>

    <template v-else>
      <div v-if="loading" class="loading-hint">加载中...</div>

      <div v-else-if="submissions.length === 0" class="empty-hint">
        暂无待审核投稿
      </div>

      <ul v-else class="submission-list">
        <li
          v-for="item in submissions"
          :key="item.id"
          class="submission-card"
        >
          <div class="card-header">
            <div class="card-meta">
              <span class="lang-badge">{{ item.language }}</span>
              <h3 class="card-title">{{ item.title }}</h3>
            </div>
            <p class="card-submitter">投稿者：{{ item.submitted_by }}</p>
          </div>

          <pre class="code-preview">{{ (item.text ?? item.code ?? '').slice(0, 600) }}{{ (item.text ?? item.code ?? '').length > 600 ? '\n...' : '' }}</pre>

          <div v-if="item.note" class="card-note">
            <span class="note-label">知识点：</span>{{ item.note }}
          </div>

          <div class="card-actions">
            <button class="btn-approve" type="button" @click="approve(item.id)">通过</button>
            <button class="btn-reject" type="button" @click="reject(item.id)">拒绝</button>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.review-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem 0;
}

.access-denied,
.loading-hint,
.empty-hint {
  padding: 2rem;
  text-align: center;
  color: rgb(var(--mt-sub));
  font-size: 0.85rem;
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-card));
  border-radius: 4px;
}

.submission-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.submission-card {
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-card));
  border-radius: 4px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.lang-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.15rem 0.5rem;
  border: 1px solid rgb(var(--mt-accent));
  color: rgb(var(--mt-accent));
  border-radius: 2px;
  font-weight: 600;
  flex-shrink: 0;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--mt-text));
}

.card-submitter {
  font-size: 0.72rem;
  color: rgb(var(--mt-sub));
  font-family: 'JetBrains Mono', monospace;
}

.code-preview {
  background: rgb(var(--mt-bg));
  border: 1px solid rgb(var(--mt-border));
  border-radius: 2px;
  padding: 0.75rem 1rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgb(var(--mt-text));
  overflow-x: auto;
  white-space: pre;
  max-height: 300px;
  overflow-y: auto;
}

.card-note {
  font-size: 0.8rem;
  color: rgb(var(--mt-sub));
  padding: 0.5rem 0.75rem;
  border-left: 2px solid rgb(var(--mt-accent));
  background: rgb(var(--mt-bg));
}

.note-label {
  font-weight: 600;
  color: rgb(var(--mt-accent));
  margin-right: 0.25rem;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-approve,
.btn-reject {
  border: none;
  padding: 0.4rem 1.25rem;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  border-radius: 2px;
  transition: opacity 0.15s;
}

.btn-approve {
  background: rgb(var(--mt-accent));
  color: rgb(var(--mt-bg));
}

.btn-approve:hover {
  opacity: 0.85;
}

.btn-reject {
  background: transparent;
  color: #e06c75;
  border: 1px solid #e06c75;
}

.btn-reject:hover {
  background: #e06c7515;
}
</style>
