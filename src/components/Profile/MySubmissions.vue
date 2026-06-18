<script setup>
import { onMounted, ref } from 'vue'
import { listMySubmissions } from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const submissions = ref([])
const loading = ref(true)

const STATUS_LABELS = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
}

function formatDate(isoString) {
  if (!isoString) return '--'
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  if (!userStore.user?.id) {
    loading.value = false
    return
  }
  const { data } = await listMySubmissions(userStore.user.id)
  submissions.value = data ?? []
  loading.value = false
})
</script>

<template>
  <div class="my-submissions">
    <div class="section-header">
      <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 社区</p>
      <h2 class="text-lg font-bold text-mt-text mb-1">我的投稿</h2>
    </div>

    <div v-if="!userStore.user" class="hint-block">
      登录后查看投稿记录
    </div>

    <div v-else-if="loading" class="hint-block">
      加载中...
    </div>

    <div v-else-if="submissions.length === 0" class="hint-block">
      暂无投稿记录。<RouterLink class="link" :to="{ name: 'submit' }">去投稿</RouterLink>
    </div>

    <ul v-else class="submissions-list">
      <li
        v-for="item in submissions"
        :key="item.id"
        class="submission-row"
      >
        <div class="row-main">
          <div class="row-left">
            <span :class="['status-badge', `status-${item.status}`]">
              {{ STATUS_LABELS[item.status] ?? item.status }}
            </span>
            <span class="row-title">{{ item.title }}</span>
            <span class="lang-tag">{{ item.language }}</span>
          </div>
          <span class="row-date">{{ formatDate(item.created_at) }}</span>
        </div>
        <div v-if="item.status === 'rejected' && item.reject_reason" class="reject-reason">
          <span class="reject-label">拒绝原因：</span>{{ item.reject_reason }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.my-submissions {
  margin-top: 2.5rem;
}

.section-header {
  margin-bottom: 1rem;
}

.hint-block {
  padding: 1.5rem;
  text-align: center;
  color: rgb(var(--mt-sub));
  font-size: 0.85rem;
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-card));
  border-radius: 4px;
}

.link {
  color: rgb(var(--mt-accent));
  text-decoration: underline;
  margin-left: 0.25rem;
}

.submissions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.submission-row {
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-card));
  border-radius: 3px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.row-left {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
  min-width: 0;
}

.status-badge {
  font-size: 0.62rem;
  padding: 0.15rem 0.5rem;
  border-radius: 2px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.status-pending {
  background: #e5c07b22;
  color: #e5c07b;
  border: 1px solid #e5c07b44;
}

.status-approved {
  background: rgb(var(--mt-accent) / 0.12);
  color: rgb(var(--mt-accent));
  border: 1px solid rgb(var(--mt-accent) / 0.3);
}

.status-rejected {
  background: #e06c7522;
  color: #e06c75;
  border: 1px solid #e06c7544;
}

.row-title {
  font-size: 0.85rem;
  color: rgb(var(--mt-text));
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lang-tag {
  font-size: 0.65rem;
  color: rgb(var(--mt-sub));
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.row-date {
  font-size: 0.72rem;
  color: rgb(var(--mt-sub));
  white-space: nowrap;
  flex-shrink: 0;
  font-family: 'JetBrains Mono', monospace;
}

.reject-reason {
  font-size: 0.78rem;
  color: #e06c75;
  padding: 0.375rem 0.625rem;
  background: #e06c7510;
  border-left: 2px solid #e06c75;
  border-radius: 0 2px 2px 0;
}

.reject-label {
  font-weight: 600;
  margin-right: 0.25rem;
}
</style>
