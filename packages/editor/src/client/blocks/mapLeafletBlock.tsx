
import React, {useState, useCallback} from 'react'

import {
  BlockProps,
  ListInput,
  FieldProps,
  Box,
  Card,
  PlaceholderInput,
  ZIndex,
  IconButton,
  Spacing,
  TypographicTextArea,
  Drawer,
  Image
} from '@karma.run/ui'

import {
  MaterialIconImageOutlined,
  MaterialIconEditOutlined,
  MaterialIconClose
} from '@karma.run/icons'

import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {ImagedEditPanel} from '../panel/imageEditPanel'

import {MapLeafletBlockValue, MapLeafletItem,} from './types'
import {isFunctionalUpdate} from '@karma.run/react'

export interface MapLeafletBlockProps extends BlockProps<MapLeafletBlockValue> {}



export function MapLeafletBlock({value, onChange, disabled}: BlockProps<MapLeafletBlockValue>) {
  const {centerLat, centerLng, zoom, caption} = value
  return (
    <>

    </>
  )
}

export function MapLeafletItemElement({value, onChange}: FieldProps<MapLeafletItem>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {image, title, lat, lng, description, imageID} = value

  return (
    <>
      <Box display="flex" flexDirection="row">
        <Card
          overflow="hidden"
          width={200}
          height={150}
          marginRight={Spacing.ExtraSmall}
          flexShrink={0}>
          <PlaceholderInput onAddClick={() => setChooseModalOpen(true)}>
            {image && (
              <Box position="relative" width="100%" height="100%">
                <Box position="absolute" zIndex={ZIndex.Default} right={0} top={0}>
                  <IconButton
                    icon={MaterialIconImageOutlined}
                    title="Choose Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setChooseModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconEditOutlined}
                    title="Edit Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => setEditModalOpen(true)}
                  />
                  <IconButton
                    icon={MaterialIconClose}
                    title="Remove Image"
                    margin={Spacing.ExtraSmall}
                    onClick={() => onChange(value => ({...value, image: null}))}
                  />
                </Box>
                {image.previewURL && <Image src={image.previewURL} width="100%" height="100%" />}
              </Box>
            )}
          </PlaceholderInput>
        </Card>
        <Box flexGrow={1}>
          <TypographicTextArea
            variant="h1"
            placeholder="Title"
            value={title}
            onChange={e => {
              const title = e.target.value
              onChange(value => ({...value, title}))
            }}
          />


        </Box>
      </Box>

      <Drawer open={isChooseModalOpen} width={480}>
        {() => (
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={image => {
              setChooseModalOpen(false)
              onChange(value => ({...value, image}))
            }}
          />
        )}
      </Drawer>
      <Drawer open={isEditModalOpen} width={480}>
        {() => (
          <ImagedEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        )}
      </Drawer>
    </>
  )
}
