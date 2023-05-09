import { useAccount } from "../hooks/api";


export function Profile() {
  const { account, error, isLoading } = useAccount();

  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>
  if (!account) return <div>Server error...</div>

  // render data
  return <div>hello {account.name} ({account?.loans?.length} Prêt)</div>
}

export default Profile;