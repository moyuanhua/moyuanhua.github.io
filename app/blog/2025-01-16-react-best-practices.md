---
slug: react-best-practices
title: React 最佳实践 2025
authors: [murphy]
tags: [react, frontend, best-practices]
---

分享一些 2025 年 React 开发的最佳实践和常用模式。

<!--truncate-->

## 1. 使用 TypeScript

TypeScript 为 React 应用提供类型安全：

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}
```

## 2. 组件设计原则

### 单一职责原则

每个组件应该只负责一件事：

```typescript
// ❌ 不好 - 组件做太多事情
function UserDashboard() {
  // 获取用户数据
  // 获取订单数据
  // 渲染复杂 UI
  // 处理多个业务逻辑
}

// ✅ 好 - 拆分成多个组件
function UserDashboard() {
  return (
    <>
      <UserProfile />
      <OrderList />
      <Analytics />
    </>
  );
}
```

### 组合优于继承

使用组合模式构建灵活的组件：

```typescript
function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function UserCard() {
  return (
    <Card title="User Profile">
      <UserAvatar />
      <UserInfo />
    </Card>
  );
}
```

## 3. 性能优化

### 避免不必要的重渲染

使用 `memo` 和 `useMemo`：

```typescript
import { memo, useMemo } from 'react';

const ExpensiveComponent = memo(({ data }: { data: Data[] }) => {
  const processedData = useMemo(
    () => expensiveOperation(data),
    [data]
  );

  return <div>{/* render processedData */}</div>;
});
```

### 虚拟化长列表

对于长列表使用虚拟化：

```typescript
import { FixedSizeList } from 'react-window';

function VirtualList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

## 4. 状态管理

### 选择合适的状态管理方案

- **本地状态**: `useState` / `useReducer`
- **共享状态**: Context API
- **复杂状态**: Zustand / Jotai / Redux Toolkit
- **服务器状态**: TanStack Query / SWR

```typescript
// 简单场景使用 Context
const ThemeContext = createContext<Theme | null>(null);

function App() {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <YourApp />
    </ThemeContext.Provider>
  );
}
```

## 5. 错误处理

### 错误边界

使用错误边界捕获组件错误：

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

## 6. 测试策略

### 单元测试

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

test('button click triggers callback', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick} label="Click me" />);

  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## 总结

遵循这些最佳实践可以帮助你构建更可维护、更高性能的 React 应用。记住：

1. 保持组件简单和专注
2. 优先考虑性能
3. 使用 TypeScript
4. 编写测试
5. 持续学习和改进

Happy coding! 🚀
