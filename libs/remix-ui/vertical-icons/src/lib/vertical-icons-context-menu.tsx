import React, { Fragment, PointerEvent, SyntheticEvent, useEffect, useRef } from 'react'
import { defaultModuleProfile, VerticalIcons } from '../../types/vertical-icons'

export interface VerticalIconsContextMenuProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  // actions: action[]
  pageX: number
  pageY: number
  profileName: string
  links: { Documentation: string, CanDeactivate: boolean }
  canBeDeactivated: boolean
  verticalIconPlugin: VerticalIcons
  hideContextMenu: () => void
}

interface MenuLinksProps {
  listItems: { Documentation: string, CanDeactivate: boolean }
  hide: () => void
  profileName: string
  canBeDeactivated: boolean
  verticalIconPlugin: VerticalIcons
  ref?: React.MutableRefObject<any>
}

interface MenuProps {
  verticalIconsPlugin: VerticalIcons
  profileName: string
  listItems: { Documentation: string, CanDeactivate: boolean }
  hide: () => void
}

function VerticalIconsContextMenu(props: VerticalIconsContextMenuProps) {
  const menuRef = useRef(null)
  useEffect(() => {
    document.addEventListener("click", props.hideContextMenu)
    return () => document.removeEventListener("click", props.hideContextMenu)
  }, [])
  useEffect(() => {
    menuRef.current.focus()
  }, [])
  
  return (
    <div
      id="menuItemsContainer"
      className="p-1 remixui_verticalIconContextcontainer bg-light shadow border"
      onBlur={props.hideContextMenu}
      style={{
        left: props.pageX,
        top: props.pageY,
        display: 'block',

      }}
      ref={menuRef}
    >
      <ul id="menuitems">
        <MenuForLinks
          hide={props.hideContextMenu}
          listItems={props.links}
          profileName={props.profileName}
          canBeDeactivated={props.canBeDeactivated}
          verticalIconPlugin={props.verticalIconPlugin}
        />
      </ul>
    </div>
  )
}

function MenuForLinks({
  listItems,
  hide,
  profileName,
  verticalIconPlugin
}: MenuLinksProps) {
  console.log('linkitems ', listItems)
  return (
    <Fragment>
      {listItems.CanDeactivate &&
        <li
        id="menuitemdeactivate"
        onClick={(evt) => {
          verticalIconPlugin
          .itemContextMenu(evt, profileName ,listItems.Documentation)
          hide()
        }}
        className="remixui_liitem"
      >
        Deactivate
      </li>}
      {(listItems.Documentation && listItems.Documentation.length > 0)
        &&
            <li
              id="menuitemdocumentation"
              className="remixui_liitem"
            >
              <a
                onClick={hide}
                href={listItems.Documentation}
                target="_blank"
              >
                Documentation
              </a>
            </li>}
    </Fragment>
  )
}

export default VerticalIconsContextMenu
