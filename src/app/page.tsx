import type { Metadata } from 'next'
import Connect4Client from '@/components/Connect4Client'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}): Promise<Metadata> {
  const rawName = searchParams?.name
  const inviter = Array.isArray(rawName) ? rawName[0] : rawName
  if (inviter) {
    const decoded = decodeURIComponent(inviter)
    const inviteText = `${decoded} invited you to a game of Connect 4!`
    return {
      title: inviteText,
      description: inviteText,
      openGraph: {
        title: inviteText,
        description: inviteText,
      },
      twitter: {
        title: inviteText,
        description: inviteText,
      },
    }
  }
  return {}
}

export default function Page() {
  return <Connect4Client />
}
