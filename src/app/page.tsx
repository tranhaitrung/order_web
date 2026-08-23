import { listMenuData } from "@/lib/menu-repository";
import { getStoreStatus, isEffectivelyClosed } from "@/lib/store-status-repository";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [menuData, storeStatus] = await Promise.all([listMenuData(), getStoreStatus()]);
  const isClosed = isEffectivelyClosed(storeStatus);

  return <HomeClient menuData={menuData} isClosed={isClosed} closedNote={storeStatus.closedNote} />;
}
