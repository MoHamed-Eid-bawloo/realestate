// Frontend-only mock service layer. Replace these functions with real API calls
// when a backend becomes available; UI code only depends on this module.

export const wait = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms))

export interface ImportRow {
  name: string
  phone: string
  email: string
  source: string
  location: string
  budgetMax: number
}

export const mockApi = {
  async importLeadsCsv(text: string): Promise<{ rows: ImportRow[]; skipped: number }> {
    await wait(520)
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const rows: ImportRow[] = []
    let skipped = 0
    for (const line of lines) {
      const [name, phone, email, source = 'website', location = 'New Cairo', budget = '8000000'] = line.split(',').map((cell) => cell.trim())
      if (!name || !phone) { skipped += 1; continue }
      rows.push({ name, phone, email: email || `${name.split(' ')[0].toLowerCase()}@example.com`, source, location, budgetMax: Number(budget) || 8000000 })
    }
    return { rows, skipped }
  },

  async sendMessageSimulated(): Promise<void> {
    await wait(180)
  },

  async save(): Promise<void> {
    await wait(260)
  },
}
