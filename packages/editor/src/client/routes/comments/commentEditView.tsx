import {ApolloError} from '@apollo/client'
import React, {memo, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {Col, FlexboxGrid, Form, Grid, Message, Panel, Row, Schema, toaster} from 'rsuite'

import {
  CommentRevisionUpdateInput,
  FullCommentFragment,
  TagType,
  useCommentQuery,
  useUpdateCommentMutation
} from '../../api'
import {CommentDeleteBtn} from '../../atoms/comment/commentDeleteBtn'
import {CommentStateDropdown} from '../../atoms/comment/commentStateDropdown'
import {CommentUser} from '../../atoms/comment/commentUser'
import {ReplyCommentBtn} from '../../atoms/comment/replyCommentBtn'
import {ModelTitle} from '../../atoms/modelTitle'
import {createCheckedPermissionComponent} from '../../atoms/permissionControl'
import {SelectTags} from '../../atoms/tag/selectTags'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../../blocks/types'

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

const CommentEditView = memo(() => {
  const {t} = useTranslation()
  const navigate = useNavigate()
  const {id} = useParams()
  const commentId = id!
  const closePath = '/comments'
  const validationModel = Schema.Model({})
  const [close, setClose] = useState<boolean>(false)
  // where the comment properties are handled
  const [comment, setComment] = useState<FullCommentFragment | undefined>(undefined)
  // where the revisions are handled
  const [revision, setRevision] = useState<CommentRevisionUpdateInput | undefined>(undefined)
  // where the tag list is handled
  const [selectedTags, setSelectedTags] = useState<string[] | null>(null)

  /**
   * Queries
   */
  const {data: commentData, loading: loadingComment} = useCommentQuery({
    variables: {
      id: commentId
    },
    onError: showErrors
  })

  const [updateCommentMutation, {loading: updatingComment}] = useUpdateCommentMutation({
    onCompleted: () =>
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('comments.edit.success')}
        </Message>
      ),
    onError: showErrors
  })

  // compute loading state
  const loading = updatingComment || loadingComment

  /**
   * Initial set of variables "comment" and "revision"
   */
  useEffect(() => {
    const tmpComment = commentData?.comment
    if (!tmpComment) {
      return
    }
    setComment(tmpComment)

    const lastRevision = getLastRevision(tmpComment)
    setRevision(lastRevision)
  }, [commentData])

  const commentTags = useMemo(() => selectedTags ?? comment?.tags?.map(tag => tag.id), [
    comment,
    selectedTags
  ])

  /**
   * Helper function to parse comment revision input object out of full revision fragment.
   * @param comment
   */
  function getLastRevision(comment: FullCommentFragment): CommentRevisionUpdateInput | undefined {
    const revisions = comment.revisions
    if (!revisions.length) {
      return
    }
    const lastRevision = revisions[revisions.length - 1]
    const parsedRevision = {
      title: lastRevision?.title,
      lead: lastRevision?.lead,
      text: lastRevision?.text
    } as CommentRevisionUpdateInput
    return parsedRevision
  }

  /**
   * Check, if revision object differs from original. Used to decide, whether to create a new revision.
   */
  function revisionChanged(): boolean {
    if (!comment) {
      return true
    }
    const originalVersion = getLastRevision(comment)
    if (JSON.stringify(originalVersion) !== JSON.stringify(revision)) {
      return true
    }
    return false
  }

  async function updateComment() {
    if (!comment) {
      return
    }
    await updateCommentMutation({
      variables: {
        id: comment.id,
        revision: revisionChanged() ? revision : undefined,
        userID: comment.user?.id || null,
        guestUsername: comment.guestUsername,
        guestUserImageID: comment.guestUserImage?.id || null,
        source: comment.source,
        tagIds: commentTags
      }
    })
    if (close) {
      navigate(closePath)
    }
  }

  return (
    <>
      <Form onSubmit={() => updateComment()} model={validationModel} fluid disabled={loading}>
        {/* heading */}
        <ModelTitle
          loading={loading}
          title={t('comments.edit.title')}
          loadingTitle={t('comments.edit.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setClose}
        />

        {/* form elements */}
        <Grid fluid>
          <Row gutter={30}>
            {/* comment content */}
            <Col xs={14}>
              <Panel bordered style={{width: '100%'}}>
                <Row>
                  {/* comment title */}
                  <Col xs={18}>
                    <Form.ControlLabel>{t('commentEditView.title')}</Form.ControlLabel>
                    <Form.Control
                      name="commentTitle"
                      value={revision?.title || ''}
                      placeholder={t('commentEditView.title')}
                      onChange={(title: string) => {
                        setRevision({...revision, title})
                      }}
                    />
                  </Col>
                  {/* comment lead */}
                  <Col xs={18}>
                    <Form.ControlLabel>{t('commentEditView.lead')}</Form.ControlLabel>
                    <Form.Control
                      name="commentLead"
                      value={revision?.lead || ''}
                      placeholder={t('commentEditView.lead')}
                      onChange={(lead: string) => {
                        setRevision({...revision, lead})
                      }}
                    />
                  </Col>
                  {/* comment text */}
                  <Col xs={24} style={{marginTop: '20px'}}>
                    <Form.ControlLabel>{t('commentEditView.comment')}</Form.ControlLabel>
                    <Panel bordered>
                      <RichTextBlock
                        value={revision?.text || []}
                        onChange={text => {
                          setRevision({...revision, text: text as RichTextBlockValue})
                        }}
                      />
                    </Panel>
                  </Col>
                </Row>
              </Panel>
            </Col>

            <Col xs={10}>
              <Row>
                {/* some actions on the comment */}
                <Col xs={24} style={{marginTop: '0px'}}>
                  <Panel bordered header={t('commentEditView.actions')}>
                    <FlexboxGrid align="bottom" justify="end">
                      <FlexboxGrid.Item style={{textAlign: 'end'}} colspan={24}>
                        <ReplyCommentBtn comment={comment} appearance="ghost" />
                      </FlexboxGrid.Item>
                      <FlexboxGrid.Item colspan={24} style={{marginTop: '10px', textAlign: 'end'}}>
                        {comment && (
                          <CommentStateDropdown
                            comment={comment}
                            onStateChanged={async (state, rejectionReason) => {
                              setComment({
                                ...comment,
                                state,
                                rejectionReason
                              })
                            }}
                          />
                        )}
                      </FlexboxGrid.Item>
                      <FlexboxGrid.Item style={{marginTop: '10px', textAlign: 'end'}} colspan={24}>
                        <CommentDeleteBtn
                          comment={comment}
                          onCommentDeleted={() => {
                            navigate(closePath)
                          }}
                        />
                      </FlexboxGrid.Item>
                    </FlexboxGrid>
                  </Panel>
                </Col>

                {/* tags & source */}
                <Col xs={24}>
                  <Panel bordered header={t('commentEditView.variousPanelHeader')}>
                    <Row>
                      {/* tags */}
                      <Col xs={24}>
                        <Form.ControlLabel>{t('commentEditView.tags')}</Form.ControlLabel>
                        <SelectTags
                          selectedTags={commentTags}
                          setSelectedTags={setSelectedTags}
                          tagType={TagType.Comment}
                        />
                      </Col>

                      {/* external source */}
                      <Col xs={24}>
                        <Form.ControlLabel>{t('commentEditView.source')}</Form.ControlLabel>
                        <Form.Control
                          name="externalSource"
                          placeholder={t('commentEditView.source')}
                          value={comment?.source || ''}
                          onChange={(source: string) => {
                            setComment({...comment, source} as FullCommentFragment)
                          }}
                        />
                      </Col>
                    </Row>
                  </Panel>
                </Col>

                {/* user or guest user */}
                <Col xs={24}>
                  <Panel bordered header={t('commentEditView.userPanelHeader')}>
                    <CommentUser comment={comment} setComment={setComment} />
                  </Panel>
                </Col>
              </Row>
            </Col>
          </Row>
        </Grid>
      </Form>
    </>
  )
})

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_UPDATE_COMMENTS',
  'CAN_TAKE_COMMENT_ACTION'
])(CommentEditView)
export {CheckedPermissionComponent as CommentEditView}