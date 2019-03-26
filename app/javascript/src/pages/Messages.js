
import React, { Component } from "react"

import Button from '@atlaskit/button';
import {
  Route,
  Link
} from 'react-router-dom'
import ContentWrapper from '../components/ContentWrapper';
import PageTitle from '../components/PageTitle';
import Tabs from '@atlaskit/tabs';
//import css from 'Dante2/dist/DanteStyles.css';
import styled from 'styled-components'
import axios from 'axios'
import serialize from 'form-serialize'

import CampaignSettings from "./campaigns/settings"
import CampaignEditor from "./campaigns/editor"
import SegmentManager from '../components/segmentManager'
import CampaignStats from "./campaigns/stats"

import { parseJwt, generateJWT } from '../components/segmentManager/jwt'


class MessagesSegment extends Component {

  constructor(props) {
    super(props)
    this.state = {
      jwt: null,
      app_users: [],
      search: false,
      meta: {}
    }
  }
  componentDidMount() {
    /*this.props.actions.fetchAppSegment(
      this.props.store.app.segments[0].id
    )*/
    this.search()
  }

  handleSave = (e) => {
    const predicates = parseJwt(this.state.jwt)
    console.log(predicates)

    axios.put(`${this.props.match.url}.json`, {
      campaign: {
        segments: predicates.data
      }
    })
      .then((response) => {
        console.log(this.state)
      })
      .catch((error) => {
        console.log(error);
      });

  }

  updateData = (data, cb) => {
    const newData = Object.assign({}, this.props.data, { segments: data.data })
    this.props.updateData(newData, cb ? cb() : null)
  }

  updatePredicate = (data, cb) => {
    const jwtToken = generateJWT(data)
    //console.log(parseJwt(jwtToken))
    if (cb)
      cb(jwtToken)
    this.setState({ jwt: jwtToken }, () => this.updateData(parseJwt(this.state.jwt), this.search))
  }

  addPredicate = (data, cb) => {

    const pending_predicate = {
      attribute: data.name,
      comparison: null,
      type: data.type,
      value: data.value
    }

    const new_predicates = this.props.data.segments.concat(pending_predicate)
    const jwtToken = generateJWT(new_predicates)
    //console.log(parseJwt(jwtToken))
    if (cb)
      cb(jwtToken)

    this.setState({ jwt: jwtToken }, () => this.updateData(parseJwt(this.state.jwt)))
  }

  deletePredicate(data) {
    const jwtToken = generateJWT(data)
    this.setState({ jwt: jwtToken }, () => this.updateData(parseJwt(this.state.jwt), this.search))
  }

  search = () => {
    this.setState({ searching: true })
    // jwt or predicates from segment
    console.log(this.state.jwt)
    const data = this.state.jwt ? parseJwt(this.state.jwt).data : this.props.data.segments
    const predicates_data = {
      data: {
        predicates: data.filter((o) => o.comparison)
      }
    }

    axios.post(`/apps/${this.props.store.app.key}/search.json`,
      predicates_data)
      .then((response) => {
        this.setState({
          app_users: response.data.collection,
          meta: response.data.meta,
          searching: false
        })
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    return <SegmentManager {...this.props}
      predicates={this.props.data.segments}
      meta={this.state.meta}
      app_users={this.state.app_users}
      updatePredicate={this.updatePredicate.bind(this)}
      addPredicate={this.addPredicate.bind(this)}
      deletePredicate={this.deletePredicate.bind(this)}
      search={this.search.bind(this)}
    >
      {
        this.state.jwt ?
          <Button isLoading={false}
            appearance={'link'}
            onClick={this.handleSave}>
            <i className="fas fa-chart-pie"></i>
            {" "}
            Save Segment
                  </Button> : null
      }

    </SegmentManager>
  }
}

class MessagesForm extends Component {

  constructor(props) {
    super(props)
    this.state = {
      selected: 0,
      data: {}
    }
  }

  componentDidMount() {
    axios.get(`${this.props.match.url}.json`)
      .then((response) => {
        console.log(response)
        this.setState({ data: response.data })
      }).catch((err) => {
        console.log(err)
      })
  }

  updateData = (data, cb) => {
    this.setState({ data: data }, cb ? cb() : null)
  }

  tabs = () => {
    var b = []

    const a = [
      {
        label: 'Settings', content: <CampaignSettings {...this.props}
          data={this.state.data}
          updateData={this.updateData}
        />
      }
    ]

    if (this.state.data.id) {
      b = [
        {
          label: 'Audience', content: <MessagesSegment  {...this.props}
            data={this.state.data}
            updateData={this.updateData} />
        },
        {
          label: 'Editor', content: <CampaignEditor   {...this.props}
            data={this.state.data} />
        }
      ]
    }

    const stats = [
      {
        label: 'Stats', content: <CampaignStats  {...this.props}
          data={this.state.data}
          updateData={this.updateData} />
      }
    ]

    // return here if campaign not sent
    const tabs = a.concat(b)

    return stats.concat(tabs)

  }

  render() {
    return <ContentWrapper>
      <PageTitle>
        Campaign {`: ${this.state.data.name}`}
      </PageTitle>
      {
        this.state.data.id || this.props.match.params.id === "new" ?
          <Tabs
            tabs={this.tabs()}
            {...this.props}
            selected={this.state.selected}
            onSelect={(tab, index) => {
              this.setState({ selected: index })
              console.log('Selected Tab', index + 1)
            }
            }
          /> : null
      }

    </ContentWrapper>
  }

}


export default class MessagesContainer extends Component {

  constructor(props) {
    super(props)
    this.state = {
      campaigns: []
    }
  }

  componentDidMount() {
    /*axios.get(`${this.props.match.url}.json`)
      .then((response) => {
        this.setState({ campaigns: response.data })
      }).catch((err) => {
        console.log(err)
      })*/
  }

  createNewCampaign = (e) => {
    this.props.history.push(`${this.props.match.url}/new`)
  }

  render() {
    return <div>
      <Route exact path={`${this.props.match.url}`}
        render={(props) => (
          <div>
            {
              this.state.campaigns.map((o) => {
                return <div>
                  {o.from_email} | {o.from_name}
                  <Button onClick={() => this.props.history.push(`${this.props.match.url}/${o.id}`)}>
                    edit
                                </Button>
                </div>
              })
            }

            <Button onClick={this.createNewCampaign}>
              create new campaign
                    </Button>
          </div>
        )} />


      <Route exact path={`${this.props.match.url}/:id`}
        render={(props) => (

          <MessagesForm
            currentUser={this.props.currentUser}
            {...this.props}
            {...props}
          />

        )} />

    </div>
  }
}