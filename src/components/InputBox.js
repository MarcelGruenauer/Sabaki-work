import {h, Component} from 'preact'
import classNames from 'classnames'

import sabaki from '../modules/sabaki.js'
import {noop} from '../modules/helper.js'

export default class InputBox extends Component {
  constructor() {
    super()

    this.state = {value: ''}

    this.handleInput = (evt) => this.setState({value: evt.currentTarget.value})
    this.handleFieldInput = (evt) => {
      let {name, type, checked, value} = evt.currentTarget

      this.setState(({values = {}}) => ({
        values: {
          ...values,
          [name]: type === 'checkbox' ? checked : value,
        },
      }))
    }
    this.stopPropagation = (evt) => evt.stopPropagation()

    this.handleKeyUp = (evt) => {
      if (!this.props.show) return

      if (evt.key === 'Escape') {
        evt.stopPropagation()
        this.cancel()
      } else if (evt.key == 'Enter' && this.props.fields == null) {
        evt.stopPropagation()
        this.submit()
      }
    }

    this.cancel = this.cancel.bind(this)
    this.submit = this.submit.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.show && !this.props.show) {
      let values = {}

      for (let field of nextProps.fields || []) {
        values[field.name] = field.value
      }

      this.setState({value: '', values})
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.show && this.props.show) {
      this.inputElement.focus()
    }
  }

  cancel() {
    if (!this.props.show) return

    if (document.activeElement === this.inputElement) this.inputElement.blur()

    let {onCancel = noop} = this.props
    sabaki.setState({showInputBox: false})
    onCancel()
  }

  submit() {
    if (!this.props.show) return

    sabaki.setState({showInputBox: false})

    let {onSubmit = noop} = this.props
    onSubmit(this.state)

    if (document.activeElement === this.inputElement) this.inputElement.blur()
  }

  renderField(field, values) {
    let value = values[field.name]
    let inputElement =
      field.type === 'checkbox'
        ? h('input', {
            name: field.name,
            type: 'checkbox',
            checked: !!value,
            onChange: this.handleFieldInput,
            onKeyUp: this.handleKeyUp,
          })
        : field.type === 'select'
          ? h(
              'select',
              {
                ref: (el) => {
                  if (field === this.props.fields[0]) this.inputElement = el
                },
                name: field.name,
                value,
                onChange: this.handleFieldInput,
                onKeyUp: this.handleKeyUp,
              },
              field.options.map((option) =>
                h('option', {value: option.value}, option.label),
              ),
            )
          : h('input', {
              ref: (el) => {
                if (field === this.props.fields[0]) this.inputElement = el
              },
              name: field.name,
              type: field.type || 'text',
              min: field.min,
              max: field.max,
              step: field.step,
              value,
              onInput: this.handleFieldInput,
              onKeyUp: this.handleKeyUp,
            })

    return h(
      'label',
      {class: `field ${field.type}`},
      h('span', {}, field.label),
      inputElement,
    )
  }

  render({show, text, fields}, {value, values = {}}) {
    return h(
      'section',
      {
        id: 'input-box',
        class: classNames({show}),

        onClick: this.cancel,
      },

      h(
        'div',
        {class: 'inner', onClick: this.stopPropagation},
        fields == null
          ? h('input', {
              ref: (el) => (this.inputElement = el),
              type: 'text',
              name: 'input',
              value,
              placeholder: text,

              onInput: this.handleInput,
              onKeyUp: this.handleKeyUp,
              onBlur: this.cancel,
            })
          : h(
              'form',
              {
                onSubmit: (evt) => {
                  evt.preventDefault()
                  this.submit()
                },
              },
              h('p', {class: 'message'}, text),
              fields.map((field) => this.renderField(field, values)),
              h('button', {type: 'submit'}, text),
            ),
      ),
    )
  }
}
