import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';

// In the phone menu, the collapsible items of one list form a group, and only one of them is open at a time.
const GroupContext = createContext(null);

export function AccordionGroup({children}) {
  const [open, setOpen] = useState(null);
  const value = useMemo(() => ({open, setOpen}), [open]);
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

// useAccordionItem opens the item when `active` turns true (the reader is on one of its pages), closing its
// siblings. Outside a group the item keeps its own state.
export function useAccordionItem(id, active) {
  const group = useContext(GroupContext);
  const [ownOpen, setOwnOpen] = useState(active);
  useEffect(() => {
    if (!active) {
      return;
    }
    if (group) {
      group.setOpen(id);
    } else {
      setOwnOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, id]);
  if (!group) {
    return {collapsed: !ownOpen, toggleCollapsed: () => setOwnOpen((o) => !o)};
  }
  const collapsed = group.open !== id;
  return {collapsed, toggleCollapsed: () => group.setOpen(collapsed ? id : null)};
}
