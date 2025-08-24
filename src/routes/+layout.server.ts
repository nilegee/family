import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ url, cookies }) => {
  return {
    url: url.pathname
  }
}