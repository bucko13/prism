import { createStore, combineReducers, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import thunkMiddleware from 'redux-thunk'

import * as reducers from './reducers'

const rootReducer = combineReducers({
  ...reducers,
})

const middleware = [thunkMiddleware]

export default () =>
  createStore(rootReducer, composeWithDevTools(applyMiddleware(...middleware)))
