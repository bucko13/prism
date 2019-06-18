import React from 'react'
import PropTypes from 'prop-types'
import { Modal, Header, Input, Label, Icon, Button } from 'semantic-ui-react'

export default function InvoiceModal({
  title,
  requestInvoice,
  changeSeconds,
  closeModal,
  seconds,
  modalOpen,
  invoice = '',
  rate,
}) {
  const cost = seconds * 0.00000001 * rate
  return (
    <Modal open={modalOpen} size="small">
      <Modal.Header>{title}</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          {!invoice.length ? (
            <React.Fragment>
              <Header as="h3">
                How many seconds would you like to have access to the content
                for?
              </Header>
              <p></p>
              <p>The rate is 1 sat/second</p>
              <Input
                placeholder="Time in seconds"
                type="number"
                value={seconds}
                onChange={changeSeconds}
              >
                <input />
                <Label>${cost.toFixed(3)}</Label>
              </Input>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Header as="h3">Please pay the invoice to continue:</Header>
              <div className="row">
                <Input type="text" placeholder="Amount" className="col">
                  <Label as="a" href={`lightning:${invoice}`}>
                    <Icon name="lightning" />
                  </Label>
                  <input
                    value={invoice}
                    style={{
                      width: 'auto',
                      textOverflow: 'ellipsis',
                      borderRightColor: '',
                    }}
                  />
                </Input>
              </div>
            </React.Fragment>
          )}
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        {invoice.length ? (
          <Button color="red" onClick={closeModal} inverted>
            Close
          </Button>
        ) : (
          <Button color="green" onClick={e => requestInvoice(e)} inverted>
            Get Invoice
          </Button>
        )}
      </Modal.Actions>
    </Modal>
  )
}

InvoiceModal.propTypes = {
  title: PropTypes.string.isRequired,
  requestInvoice: PropTypes.func.isRequired,
  changeSeconds: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  seconds: PropTypes.number.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  invoice: PropTypes.string.isRequired,
  rate: PropTypes.number,
}
