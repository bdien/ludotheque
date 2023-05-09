import { useAccount } from "../hooks/api";
import MiniItem from "./mini_item";


export function Profile() {
  const { account, error, isLoading } = useAccount();

  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>
  if (!account) return <div>Server error...</div>

  // render data
  return <div>hello {account.name} ({account?.loans?.length} Prêt)

    En retard:
    {account?.loans?.map((obj,) =>
      <MiniItem id={obj.item}/>
    )}
  </div>
}

export default Profile;