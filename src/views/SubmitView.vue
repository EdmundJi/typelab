<script setup lang="ts">
import { ref } from 'vue'
import { submitLesson } from '@/lib/adapters/db'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const title = ref('')
const language = ref('python')
const code = ref('')
const note = ref('')

const submitting = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  if (!title.value.trim() || !code.value.trim()) {
    errorMsg.value = '请填写标题和代码'
    return
  }

  submitting.value = true
  try {
    const { error } = await submitLesson(userStore.user.id, {
      title: title.value.trim(),
      language: language.value,
      code: code.value,
      note: note.value.trim() || undefined,
    })
    if (error) {
      errorMsg.value = `提交失败：${error.message ?? '未知错误'}`
    } else {
      submitted.value = true
      title.value = ''
      language.value = 'python'
      code.value = ''
      note.value = ''
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  submitted.value = false
  errorMsg.value = ''
}
</script>

<template>
  <div class="submit-page">
    <div class="mb-8">
      <p class="text-xs text-mt-sub tracking-[0.2em] uppercase mb-2">// 社区</p>
      <h1 class="text-2xl font-bold text-mt-text mb-1">投稿题目</h1>
      <p class="text-xs text-mt-sub tracking-wide">提交你的代码题目，审核通过后将出现在题库</p>
    </div>

    <div v-if="submitted" class="submit-success">
      <div class="success-icon">✓</div>
      <h2 class="success-title">提交成功</h2>
      <p class="success-desc">你的题目已提交，正在等待审核。审核结果可在「个人主页 → 我的投稿」中查看。</p>
      <button class="btn-primary mt-4" type="button" @click="resetForm">再投一题</button>
    </div>

    <form v-else class="submit-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label" for="title">题目标题 <span class="required">*</span></label>
        <input
          id="title"
          v-model="title"
          class="form-input"
          type="text"
          placeholder="例：二分查找（Python）"
          maxlength="100"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="language">语言 <span class="required">*</span></label>
        <select id="language" v-model="language" class="form-select">
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="code">代码 <span class="required">*</span></label>
        <textarea
          id="code"
          v-model="code"
          class="form-textarea code-textarea"
          placeholder="在此粘贴或输入代码..."
          rows="16"
          spellcheck="false"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="note">知识点说明 <span class="optional">（可选）</span></label>
        <textarea
          id="note"
          v-model="note"
          class="form-textarea"
          placeholder="简要说明考察的知识点，完成打字后展示给练习者..."
          rows="3"
        />
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      <div class="form-actions">
        <button
          class="btn-primary"
          type="submit"
          :disabled="submitting"
        >
          {{ submitting ? '提交中...' : '提交审核' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.submit-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 0;
}

.submit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--mt-sub));
  font-weight: 500;
}

.required {
  color: rgb(var(--mt-accent));
}

.optional {
  color: rgb(var(--mt-sub));
  font-size: 0.65rem;
  text-transform: none;
  letter-spacing: 0;
}

.form-input,
.form-select,
.form-textarea {
  background: rgb(var(--mt-card));
  border: 1px solid rgb(var(--mt-border));
  color: rgb(var(--mt-text));
  border-radius: 2px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: rgb(var(--mt-accent));
}

.form-select {
  cursor: pointer;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.code-textarea {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.8rem;
  min-height: 240px;
  tab-size: 4;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

.btn-primary {
  background: rgb(var(--mt-accent));
  color: rgb(var(--mt-bg));
  border: none;
  padding: 0.5rem 1.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  cursor: pointer;
  border-radius: 2px;
  transition: opacity 0.15s;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:not(:disabled):hover {
  opacity: 0.85;
}

.error-msg {
  color: #e06c75;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e06c7540;
  background: #e06c7510;
  border-radius: 2px;
}

.submit-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 2rem;
  border: 1px solid rgb(var(--mt-border));
  background: rgb(var(--mt-card));
  border-radius: 4px;
  gap: 0.75rem;
}

.success-icon {
  font-size: 2rem;
  color: rgb(var(--mt-accent));
  font-weight: bold;
}

.success-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--mt-text));
}

.success-desc {
  font-size: 0.85rem;
  color: rgb(var(--mt-sub));
  max-width: 400px;
  line-height: 1.6;
}
</style>
