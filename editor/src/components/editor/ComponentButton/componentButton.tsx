import * as React from 'react'
import onClickOutside from 'react-onclickoutside'
import { Icons, OnClickOutsideHOC } from '../../../uuiui'
import { betterReactMemo } from '../../../uuiui-deps'

interface ComponentOrInstanceIndicatorProps {
  label: string
  component: boolean
  instance: boolean
}

export const ComponentOrInstanceIndicator = betterReactMemo(
  'ComponentOrInstanceIndicator',
  (props: ComponentOrInstanceIndicatorProps) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const toggleOpen = React.useCallback(() => {
      setIsOpen(!isOpen)
    }, [isOpen])

    const closePopup = React.useCallback(() => setIsOpen(false), [])

    return (
      <div
        id={'ComponentView'}
        onClick={toggleOpen}
        style={{
          position: 'relative',
          display: 'flex',
          gap: 8,
          maxWidth: 80,
          padding: '5px 8px',
          borderRadius: 2,
          // make the menu button slightly darker if the menu is open
          background: isOpen ? '#4842EE' : '#5852FE',
          cursor: 'pointer',
          boxShadow: `0px 0px 0px 1px ${
            props.component ? '#' : props.instance ? '#5852FE' : '#888'
          }`,
          color: props.component ? 'white' : props.instance ? '#5852FE' : 'inherit',
        }}
      >
        <div style={{ background: 'pink', width: '5', alignItems: 'center' }}>ComponentIcon</div>
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'Ellipsis',
          }}
        >
          {props.label}
        </span>
        {/* rotate the expansion arrow up when the menu is open */}
        <Icons.ExpansionArrow style={{ transform: isOpen ? 'rotate(180deg)' : undefined }} />
        {isOpen ? (
          <OnClickOutsideHOC onClickOutside={closePopup}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 25,
                borderRadius: 5,
                zIndex: 99999,
                width: 170,
                height: 95,
                border: '1px solid grey',
                background: 'white',
                boxShadow: 'inset 0px 0px 0px .5px lightgrey, 0px 2px 5px 0px lightgrey',
                display: 'flex',
                flexDirection: 'column',
                color: '#333',
                overflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Test
            </div>
          </OnClickOutsideHOC>
        ) : null}
      </div>
    )
  },
)
