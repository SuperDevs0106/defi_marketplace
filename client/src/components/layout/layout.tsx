import React, { Props, HTMLProps, HTMLAttributes } from 'react'
import { BEM, modList, extendClassName } from 'ui'
import styles from './layout.module.scss'

interface LayoutProps {
  type?: 'sides' | 'grid' | 'container'
  align?: 'center' | 'start' | 'end' | string
  justify?: 'center' | 'start' | 'end' | 'space-between' | string
  direction?: 'row'| 'column'
}

const b = BEM('layout', styles)
export function UiLayout(props: LayoutProps & HTMLAttributes<any> & Props<any>) {
  const { type, align, justify, direction, children } = props
  const cleanProps = { ...props, type: undefined, align: undefined, justify, direction: undefined }

  return (
    <div {...cleanProps} className={extendClassName(props, b([type, `align-${align}`, `justify-${justify}`, `flex-direction-${direction}`]))}>
      {children}
    </div>
  )
}
