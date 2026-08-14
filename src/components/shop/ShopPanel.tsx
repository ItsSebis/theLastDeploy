import { canPurchase, SHOP_ITEMS } from "../../store/shop";
import { useGameStore } from "../../store/gameStore";

export function ShopPanel() {
  const runway = useGameStore((s) => s.resources.runway);
  const shopPurchases = useGameStore((s) => s.shopPurchases);
  const purchaseShopItem = useGameStore((s) => s.purchaseShopItem);

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-title">Shop</div>
      {SHOP_ITEMS.map((item) => {
        const check = canPurchase(item.id, runway, shopPurchases);
        return (
          <div className="shop-item" key={item.id}>
            <div className="shop-item-name">{item.name}</div>
            <div className="shop-item-desc">{item.description}</div>
            <button
              className="btn shop-item-buy"
              disabled={!check.allowed}
              onClick={() => purchaseShopItem(item.id)}
            >
              💰 {item.cost}
            </button>
          </div>
        );
      })}
    </div>
  );
}
