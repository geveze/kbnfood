# React Key Prop Best Practices

Bu rehber, Keban Food Performance Sistemi'nde React key prop hatalarını önlemek için best practices ve otomatik kontrol mekanizmalarını açıklamaktadır.

## 1. Key Prop Nedir ve Neden Önemlidir?

### Tanım
React'te `key` prop'u, liste öğelerini benzersiz şekilde tanımlamak için kullanılır. React, DOM'u verimli bir şekilde güncellemek için key'leri kullanır.

### Neden Önemli?
- **Performans**: React, key'ler sayesinde hangi öğelerin değiştiğini bilir
- **State Korunması**: Öğelerin state'i doğru şekilde korunur
- **Animasyonlar**: Animasyonlar doğru öğelere uygulanır
- **Form Verileri**: Form input'ları doğru state'le bağlı kalır

## 2. Key Prop Hatalarının Türleri

### ❌ Hata 1: Key Olmadan Liste Render Etme

```typescript
// ❌ YANLIŞ - Key yok
{items.map((item) => (
  <div>{item.name}</div>
))}

// ✅ DOĞRU - Key var
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### ❌ Hata 2: Index'i Key Olarak Kullanma (Dinamik Listeler)

```typescript
// ❌ YANLIŞ - Index dinamik listede sorun yaratır
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ✅ DOĞRU - Unique ID kullan
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

**Neden sorun yaratır?**
- Liste sıralandığında, index'ler değişir
- Yeni öğe eklendiğinde, index'ler kaymaz
- React, yanlış öğeleri güncelleyebilir

### ❌ Hata 3: Rastgele Key Oluşturma

```typescript
// ❌ YANLIŞ - Her render'da yeni key
{items.map((item) => (
  <div key={Math.random()}>{item.name}</div>
))}

// ✅ DOĞRU - Sabit, unique key
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### ❌ Hata 4: Nested Listeler İçin Eksik Key

```typescript
// ❌ YANLIŞ - İç liste key'siz
{categories.map((cat) => (
  <div key={cat.id}>
    {cat.items.map((item) => (
      <span>{item.name}</span>  {/* Key yok! */}
    ))}
  </div>
))}

// ✅ DOĞRU - Her seviyede key
{categories.map((cat) => (
  <div key={cat.id}>
    {cat.items.map((item) => (
      <span key={item.id}>{item.name}</span>
    ))}
  </div>
))}
```

### ❌ Hata 5: Header/Footer Satırları İçin Key Olmama

```typescript
// ❌ YANLIŞ - Header satırı key'siz
<table>
  <thead>
    <tr>  {/* Key yok! */}
      <th>Ad</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {users.map((user) => (
      <tr key={user.id}>
        <td>{user.name}</td>
        <td>{user.email}</td>
      </tr>
    ))}
  </tbody>
</table>

// ✅ DOĞRU - Header satırına key eklendi
<table>
  <thead>
    <tr key="header-row">
      <th>Ad</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {users.map((user) => (
      <tr key={user.id}>
        <td>{user.name}</td>
        <td>{user.email}</td>
      </tr>
    ))}
  </tbody>
</table>
```

## 3. Key Prop Seçim Stratejileri

### Strateji 1: Unique ID Kullanma (En İyi)

```typescript
// Database'den gelen unique ID
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

**Avantajlar:**
- Tamamen güvenilir
- Liste sıralanırsa sorun yok
- Yeni öğeler eklenirse sorun yok

### Strateji 2: Composite Key (Birden Fazla Alan)

```typescript
// Unique olmayan ID'ler için birleştir
{items.map((item, index) => (
  <div key={`${item.category}-${item.name}-${index}`}>
    {item.name}
  </div>
))}
```

**Ne zaman kullan:**
- Tek bir unique alan yok
- Birden fazla alan kombinasyonu unique
- Keban Food örneği: `card-${card.id}-${index}`

### Strateji 3: UUID Oluşturma (Yeni Öğeler)

```typescript
import { v4 as uuidv4 } from 'uuid';

// Yeni öğe eklerken UUID oluştur
const newItem = {
  id: uuidv4(),  // Unique ID
  name: "Yeni Öğe"
};

{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

## 4. ESLint Kuralları ile Otomatik Kontrol

### ESLint Kurulumu

```bash
npm install --save-dev eslint eslint-plugin-react
```

### .eslintrc.json Konfigürasyonu

```json
{
  "extends": ["react-app"],
  "plugins": ["react"],
  "rules": {
    "react/jsx-key": ["error", {
      "checkFragmentShorthand": true,
      "checkKeyMustBeforeSpread": true
    }],
    "react/no-array-index-key": "warn"
  }
}
```

### ESLint Çalıştırma

```bash
# Tüm dosyaları kontrol et
npm run lint

# Sadece TypeScript dosyalarını kontrol et
npm run lint -- --ext .ts,.tsx

# Otomatik düzeltme (mümkün olan hatalar)
npm run lint -- --fix
```

## 5. TypeScript ile Type Safety

### Custom Hook: useKeyedList

```typescript
// hooks/useKeyedList.ts
interface KeyedItem {
  id: string | number;
}

export function useKeyedList<T extends KeyedItem>(items: T[]) {
  // Compile-time'da key'lerin unique olduğunu kontrol et
  const keys = items.map(item => item.id);
  const uniqueKeys = new Set(keys);
  
  if (keys.length !== uniqueKeys.size) {
    console.warn('Duplicate keys detected in list');
  }
  
  return items;
}

// Kullanım
const validatedItems = useKeyedList(items);
{validatedItems.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### Type-Safe List Component

```typescript
interface ListProps<T extends { id: string | number }> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor?: (item: T) => string | number;
}

export function SafeList<T extends { id: string | number }>({
  items,
  renderItem,
  keyExtractor = (item) => item.id,
}: ListProps<T>) {
  return (
    <div>
      {items.map((item) => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Kullanım - TypeScript otomatik olarak id field'ını gerektirir
<SafeList
  items={users}  // TypeScript: users'ın id field'ı olması gerekir
  renderItem={(user) => <span>{user.name}</span>}
/>
```

## 6. Vitest ile Unit Test

### Test: Key Uniqueness

```typescript
// components/List.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafeList from './SafeList';

describe('SafeList - Key Prop', () => {
  it('should render items with unique keys', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ];

    const { container } = render(
      <SafeList items={items} renderItem={(item) => <div>{item.name}</div>} />
    );

    // Tüm öğelerin render edildiğini kontrol et
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('should handle duplicate IDs gracefully', () => {
    const items = [
      { id: 1, name: 'Item 1' },
      { id: 1, name: 'Item 1 Duplicate' },  // Duplicate ID
    ];

    // Warning veya error bekliyoruz
    const consoleSpy = vi.spyOn(console, 'warn');
    
    render(
      <SafeList items={items} renderItem={(item) => <div>{item.name}</div>} />
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should maintain item state when list is reordered', () => {
    const items1 = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    const items2 = [
      { id: 2, name: 'Item 2' },
      { id: 1, name: 'Item 1' },
    ];

    const { rerender } = render(
      <SafeList items={items1} renderItem={(item) => <div>{item.name}</div>} />
    );

    rerender(
      <SafeList items={items2} renderItem={(item) => <div>{item.name}</div>} />
    );

    // Sıra değişse de doğru öğeler görünmeli
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
```

## 7. Code Review Checklist

Kod review yaparken aşağıdaki kontrolleri yapın:

- [ ] **Tüm `.map()` çağrılarında key var mı?**
  ```typescript
  items.map((item) => (  // ✅ Key var mı?
    <div key={item.id}>{item.name}</div>
  ))
  ```

- [ ] **Key olarak index kullanılmış mı?** (Dinamik listeler için)
  ```typescript
  items.map((item, index) => (  // ❌ Index key'i sorun yaratabilir
    <div key={index}>{item.name}</div>
  ))
  ```

- [ ] **Key unique mı?**
  ```typescript
  // ❌ Duplicate key'ler var mı?
  items.map((item) => (
    <div key={item.category}>{item.name}</div>  // Aynı kategori = aynı key
  ))
  ```

- [ ] **Nested listeler key'li mi?**
  ```typescript
  categories.map((cat) => (
    <div key={cat.id}>
      {cat.items.map((item) => (  // ✅ İç liste de key'li mi?
        <span key={item.id}>{item.name}</span>
      ))}
    </div>
  ))
  ```

- [ ] **Header/Footer satırları key'li mi?**
  ```typescript
  <table>
    <thead>
      <tr key="header">  {/* ✅ Key var */}
        <th>Ad</th>
      </tr>
    </thead>
  </table>
  ```

## 8. Keban Food Performance Sistemi Uygulaması

### Mevcut Düzeltme

```typescript
// ActualValueInputForm.tsx - Düzeltilmiş versiyon
<table className="data-table">
  <thead>
    <tr key="header-row">  {/* ✅ Header key'li */}
      <th>Hedef</th>
      <th>Boyut</th>
      {/* ... */}
    </tr>
  </thead>
  <tbody>
    {targetCards.map((card: any, index: number) => (
      <tr key={`card-${card.id}-${index}`}>  {/* ✅ Composite key */}
        <td>{card.target}</td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>
```

### Gelecek Iyileştirmeler

1. **Database'den Unique ID Kullan**
   ```typescript
   // Şu anki: card-${card.id}-${index}
   // Gelecek: key={card.id} (eğer card.id unique ise)
   ```

2. **Type-Safe List Component Oluştur**
   ```typescript
   interface KPICard {
     id: number;
     target: string;
     // ...
   }
   
   <SafeList<KPICard>
     items={targetCards}
     renderItem={(card) => (/* ... */)}
   />
   ```

3. **ESLint Kurallarını Aktifleştir**
   - Tüm `.map()` çağrılarını otomatik kontrol et
   - Index key'i kullanımını uyar

## 9. Özet: 5 Adımda Hatasız Key Prop

1. **Her `.map()` çağrısında key ekle**
   ```typescript
   items.map((item) => <div key={item.id}>{item.name}</div>)
   ```

2. **Unique ID kullan** (index değil)
   ```typescript
   key={item.id}  // ✅ Unique
   key={index}    // ❌ Dinamik listeler için sorun
   ```

3. **Nested listeler için de key ekle**
   ```typescript
   {outer.map((o) => (
     <div key={o.id}>
       {o.inner.map((i) => <span key={i.id}>{i.name}</span>)}
     </div>
   ))}
   ```

4. **Header/Footer satırlarını unutma**
   ```typescript
   <tr key="header-row">...</tr>
   ```

5. **ESLint kurallarını aktifleştir**
   ```bash
   npm run lint
   ```

## Referanslar

- [React Key Prop Rehberi](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- [ESLint React Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [React Reconciliation](https://react.dev/learn/preserving-and-resetting-state)
