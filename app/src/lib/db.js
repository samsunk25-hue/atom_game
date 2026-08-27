/**
 * 데이터 계층.
 * VITE_FIREBASE_* 환경변수가 모두 있으면 Firestore를 쓰고,
 * 없으면 localStorage 백엔드로 자동 대체된다(설정 없이도 바로 실행 가능).
 */

const env = import.meta.env
const FIREBASE_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

export const usingFirebase = FIREBASE_KEYS.every((k) => !!env[k])

/* ─────────────────────────── localStorage 백엔드 ─────────────────────────── */

const LS_KEY = 'moodum:data:v1'
const listeners = new Set()

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || { classes: {}, students: {} }
  } catch {
    return { classes: {}, students: {} }
  }
}

function writeAll(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
  listeners.forEach((fn) => fn())
}

// 다른 탭(학생 화면)에서의 변경 반영
window.addEventListener('storage', (e) => {
  if (e.key === LS_KEY) listeners.forEach((fn) => fn())
})

function lsSubscribe(fn) {
  listeners.add(fn)
  fn()
  return () => listeners.delete(fn)
}

const localBackend = {
  async listClasses(teacher) {
    const { classes } = readAll()
    return Object.values(classes)
      .filter((c) => c.teacher === teacher)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  },
  async createClass(cls) {
    const data = readAll()
    data.classes[cls.code] = cls
    writeAll(data)
    return cls
  },
  async getClass(code) {
    return readAll().classes[code] || null
  },
  async updateClass(code, patch) {
    const data = readAll()
    if (!data.classes[code]) return null
    data.classes[code] = { ...data.classes[code], ...patch }
    writeAll(data)
    return data.classes[code]
  },
  async deleteClass(code) {
    const data = readAll()
    delete data.classes[code]
    delete data.students[code]
    writeAll(data)
  },
  async upsertStudent(code, student) {
    const data = readAll()
    data.students[code] = data.students[code] || {}
    data.students[code][student.sid] = student
    writeAll(data)
    return student
  },
  async removeStudent(code, sid) {
    const data = readAll()
    if (data.students[code]) delete data.students[code][sid]
    writeAll(data)
  },
  async listStudents(code) {
    return Object.values(readAll().students[code] || {})
  },
  subscribeClass(code, cb) {
    return lsSubscribe(() => cb(readAll().classes[code] || null))
  },
  subscribeStudents(code, cb) {
    return lsSubscribe(() => cb(Object.values(readAll().students[code] || {})))
  },
}

/* ─────────────────────────── Firestore 백엔드 ─────────────────────────── */

let firestoreBackend = null
let authError = null

/*
 * Firestore는 배열 안에 배열을 담지 못한다("Nested arrays are not allowed").
 * 앱에서는 groups를 [[학번,…], …], history를 [[[학번,…], …], …] 로 다루는 편이 훨씬 읽기 쉬우므로
 * 저장 직전에만 map으로 한 겹 감싸고, 읽을 때 되돌린다. 앱 코드는 이 변환을 몰라도 된다.
 */
const packGroups = (groups) => (groups || []).map((members) => ({ members }))
const unpackGroups = (packed) => (packed || []).map((g) => g?.members || [])

function packClass(cls) {
  const out = { ...cls }
  if ('groups' in out) out.groups = packGroups(out.groups)
  if ('history' in out) out.history = (out.history || []).map((round) => ({ groups: packGroups(round) }))
  return out
}

function unpackClass(doc) {
  if (!doc) return doc
  const out = { ...doc }
  if ('groups' in out) out.groups = unpackGroups(out.groups)
  if ('history' in out) out.history = (out.history || []).map((r) => unpackGroups(r?.groups))
  return out
}

/** 익명 인증이 막혀 있는 등 Firebase 연결 문제를 UI에 알리기 위한 메시지 */
export function getAuthError() {
  return authError
}

async function loadFirestore() {
  if (firestoreBackend) return firestoreBackend

  const { initializeApp } = await import('firebase/app')
  const fs = await import('firebase/firestore')
  const auth = await import('firebase/auth')

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const db = fs.getFirestore(app)

  // 보안 규칙이 익명 토큰을 요구한다. 로그인 화면 없이 앱이 알아서 익명 인증을 받는다.
  const signedIn = new Promise((resolve, reject) => {
    const a = auth.getAuth(app)
    auth.onAuthStateChanged(a, (user) => user && resolve(user))
    auth.signInAnonymously(a).catch((e) => {
      const needsToggle =
        e?.code === 'auth/operation-not-allowed' || e?.code === 'auth/configuration-not-found'
      authError = needsToggle
        ? 'Firebase 콘솔 → Authentication → Sign-in method 에서 "익명(Anonymous)"을 켜 주세요. ' +
          '켜면 새로고침만 해도 바로 연결됩니다.'
        : `Firebase 인증에 실패했어요: ${e?.code || e}`
      reject(e)
    })
  })

  const classRef = (code) => fs.doc(db, 'classes', code)
  const studentsRef = (code) => fs.collection(db, 'classes', code, 'students')

  firestoreBackend = {
    ready: signedIn,
    async listClasses(teacher) {
      const q = fs.query(fs.collection(db, 'classes'), fs.where('teacher', '==', teacher))
      const snap = await fs.getDocs(q)
      return snap.docs
        .map((d) => unpackClass(d.data()))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    },
    async createClass(cls) {
      await fs.setDoc(classRef(cls.code), packClass(cls))
      return cls
    },
    async getClass(code) {
      const snap = await fs.getDoc(classRef(code))
      return snap.exists() ? unpackClass(snap.data()) : null
    },
    async updateClass(code, patch) {
      await fs.updateDoc(classRef(code), packClass(patch))
      return this.getClass(code)
    },
    async deleteClass(code) {
      await fs.deleteDoc(classRef(code))
    },
    async upsertStudent(code, student) {
      await fs.setDoc(fs.doc(studentsRef(code), String(student.sid)), student)
      return student
    },
    async removeStudent(code, sid) {
      await fs.deleteDoc(fs.doc(studentsRef(code), String(sid)))
    },
    async listStudents(code) {
      const snap = await fs.getDocs(studentsRef(code))
      return snap.docs.map((d) => d.data())
    },
    subscribeClass(code, cb) {
      return fs.onSnapshot(classRef(code), (s) => cb(s.exists() ? unpackClass(s.data()) : null))
    },
    subscribeStudents(code, cb) {
      return fs.onSnapshot(studentsRef(code), (s) => cb(s.docs.map((d) => d.data())))
    },
  }
  return firestoreBackend
}

/* ─────────────────────────── 공용 API ─────────────────────────── */

async function backendReady() {
  const backend = usingFirebase ? await loadFirestore() : localBackend
  if (backend.ready) await backend.ready // 익명 인증이 끝난 뒤에 읽고 쓴다
  return backend
}

function call(method) {
  return async (...args) => {
    const backend = await backendReady()
    return backend[method](...args)
  }
}

function callSubscribe(method) {
  return (...args) => {
    let unsub = null
    let cancelled = false
    const start = async () => {
      const backend = await backendReady()
      if (cancelled) return
      unsub = backend[method](...args)
    }
    start().catch(() => {}) // 인증 실패는 getAuthError()로 UI에 표시한다
    return () => {
      cancelled = true
      if (unsub) unsub()
    }
  }
}

export const listClasses = call('listClasses')
export const createClass = call('createClass')
export const getClass = call('getClass')
export const updateClass = call('updateClass')
export const deleteClass = call('deleteClass')
export const upsertStudent = call('upsertStudent')
export const removeStudent = call('removeStudent')
export const listStudents = call('listStudents')
export const subscribeClass = callSubscribe('subscribeClass')
export const subscribeStudents = callSubscribe('subscribeStudents')

/** 학급 코드 생성 (읽기 쉬운 6자리) */
export function makeClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}
