import { ref, Ref } from 'vue'

/**
 * 防抖composable
 * @param delay 延迟时间（毫秒）
 * @returns 防抖函数和状态
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500
) {
  const timeoutId = ref<NodeJS.Timeout | null>(null)
  const isDebouncing = ref(false)

  const debouncedFn = (...args: Parameters<T>) => {
    isDebouncing.value = true
    
    // 清除之前的定时器
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
    }

    // 设置新的定时器
    timeoutId.value = setTimeout(() => {
      fn(...args)
      isDebouncing.value = false
    }, delay)
  }

  // 立即执行函数（取消防抖）
  const immediateFn = (...args: Parameters<T>) => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
      timeoutId.value = null
    }
    isDebouncing.value = false
    fn(...args)
  }

  // 取消防抖
  const cancel = () => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
      timeoutId.value = null
    }
    isDebouncing.value = false
  }

  return {
    debouncedFn,
    immediateFn,
    cancel,
    isDebouncing
  }
}

/**
 * 防抖值composable
 * @param initialValue 初始值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖值和状态
 */
export function useDebouncedValue<T>(
  initialValue: T,
  delay: number = 500
) {
  const value = ref<T>(initialValue)
  const debouncedValue = ref<T>(initialValue)
  const timeoutId = ref<NodeJS.Timeout | null>(null)
  const isDebouncing = ref(false)

  const setValue = (newValue: T) => {
    value.value = newValue
    isDebouncing.value = true

    // 清除之前的定时器
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
    }

    // 设置新的定时器
    timeoutId.value = setTimeout(() => {
      debouncedValue.value = newValue
      isDebouncing.value = false
    }, delay)
  }

  // 立即设置值（取消防抖）
  const setValueImmediate = (newValue: T) => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
      timeoutId.value = null
    }
    value.value = newValue
    debouncedValue.value = newValue
    isDebouncing.value = false
  }

  // 取消防抖
  const cancel = () => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
      timeoutId.value = null
    }
    isDebouncing.value = false
  }

  return {
    value,
    debouncedValue,
    setValue,
    setValueImmediate,
    cancel,
    isDebouncing
  }
} 