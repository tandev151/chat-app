# Lesson: Forms and API feedback

## What we built

- Login, Register, Add friend, and Confirm friend forms.
- Each form has: local state for fields, `isSubmitting`, and a `message` (success or error) from the API.

## Patterns

### 1. Controlled inputs and single submit handler

- Each field is controlled: `value={email}`, `onChange={(e) => setEmail(e.target.value)}`.
- One `handleSubmit` (or `handleConfirm`) that:
  - Calls `e.preventDefault()`.
  - Clears previous message.
  - Validates required fields (early return with setMessage if invalid).
  - Sets `isSubmitting(true)`, then calls the API in a try/finally; in finally, sets `isSubmitting(false)`.

### 2. Showing API errors

- In `catch`, we read `err.response?.data?.message` (axios shape). Backend often sends `{ message: string }` or `{ message: string[] }`.
- We normalize to a single string and call `setMessage({ type: 'error', text })`. Same pattern for success after a successful call.

### 3. Accessibility

- Every input has a matching `<label>` (or `aria-label` / `sr-only` label).
- Buttons have `aria-label` where the visible text isn’t enough context.
- Success/error message has `role="alert"` so screen readers announce it.
- Buttons are `disabled={isSubmitting}` to avoid double submit.

### 4. Keyboard support for custom actions

- For “Reject” we use `type="button"` and `onKeyDown` so that Enter/Space trigger the same action as click (for accessibility).

## Takeaway

Keep forms simple: controlled state, one submit path, clear loading and message state, and normalize API errors before showing them. Add labels and ARIA so the form is usable with keyboard and screen readers.
