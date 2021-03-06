import React, {useState} from "react";
import {useHotkeys} from "./index";
import {act, renderHook} from "@testing-library/react-hooks";
import {act as reactAct, fireEvent, render, waitFor} from "@testing-library/react";

function useWrapper(keys: string) {
  const [count, setCount] = useState(0);
  const increment = () => setCount((x) => x + 1);

  useHotkeys(keys, increment);

  return count;
}

function useDeps(setDeps: boolean) {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);

  useHotkeys('a', increment, {}, setDeps ? [count] : []);

  return count;
}

function useDepsAsThird() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);

  useHotkeys('a', increment, [count]);

  return count;
}

function useSplit() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);

  useHotkeys('shift-a', increment, {splitKey: '-'},);

  return count;
}

function useSplitAndDeps() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);

  useHotkeys('shift-a', increment, {splitKey: '-'}, [count]);

  return count;
}

const HotkeysOnInput = ({onPress, useTags}: { onPress: () => void, useTags?: boolean}) => {
  useHotkeys('a', onPress, {enableOnTags: useTags ? ['INPUT'] : undefined});

  return (
    <input type="text" data-testid={'input'}/>
  );
};

test('useHotkeys should listen to key presses', () => {
  const {result} = renderHook(() => useWrapper('a'));

  expect(result.current).toBe(0);

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65});
  });

  expect(result.current).toBe(1);
});

test('useHotkeys should listen to its own context', () => {
  const resultA = renderHook(() => useWrapper('a'));
  const resultB = renderHook(() => useWrapper('b'));

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65});
  });

  expect(resultA.result.current).toBe(1);
  expect(resultB.result.current).toBe(0);
});

test('useHotkeys should rebuild callback after deps change', () => {
  const resultA = renderHook(() => useDeps(false));
  const resultB = renderHook(() => useDeps(true));

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65});
  });

  expect(resultA.result.current).toBe(1);
  expect(resultB.result.current).toBe(1);

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65});
  });

  expect(resultA.result.current).toBe(1);
  expect(resultB.result.current).toBe(2);
});

test('useHotkeys correctly assign deps when used as third argument and options being omitted', () => {
  const resultA = renderHook(() => useDepsAsThird());

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65});
  });

  expect(resultA.result.current).toBe(1);

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65});
  });

  expect(resultA.result.current).toBe(2);
});

test('useHotkeys should use correct char to split combinations', () => {
  const resultA = renderHook(() => useSplit());

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65, shiftKey: true});
  });

  expect(resultA.result.current).toBe(1);

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65, shiftKey: true});
  });

  expect(resultA.result.current).toBe(1);
});

test('useHotkeys should use correctly assign options and deps argument when using all four arguments', () => {
  const resultA = renderHook(() => useSplitAndDeps());

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65, shiftKey: true});
  });

  expect(resultA.result.current).toBe(1);

  act(() => {
    fireEvent.keyDown(document.body, {key: 'a', keyCode: 65, shiftKey: true});
  });

  expect(resultA.result.current).toBe(2);
});

test('useHotkeys should be enabled on given form tags', async () => {
  const onPress = jest.fn();
  render(<HotkeysOnInput onPress={onPress} useTags={true}/>);

  const input = document.querySelector('input');

  expect(input).not.toBe(null);

  reactAct(() => {
    fireEvent.keyDown(input!, {key: 'a', keyCode: 65});
  });

  expect(onPress).toHaveBeenCalled();
});

/*test('useHotkeys should ignore form tags when not declared', async () => {
  const onPress = jest.fn();
  render(<HotkeysOnInput onPress={onPress}/>);

  const input = document.querySelector('input');

  expect(input).not.toBe(null);

  await waitFor(() => input!.focus());

  reactAct(() => {
    fireEvent.keyDown(input!, {key: 'a', keyCode: 65});
  });

  expect(onPress).not.toHaveBeenCalled();
});*/
