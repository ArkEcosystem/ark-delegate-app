
import React, { Component } from 'react'
import { connect } from 'react-redux'
import humanizeDuration from 'humanize-duration'

import {
  ScrollView,
  Icon,
  Row,
  Subtitle,
  Text,
  Title,
  View,
  Image,
  Divider,
  Tile,
  Screen,
} from '@shoutem/ui'
import { NavigationBar } from '@shoutem/ui/navigation'

import CONST from '../../Helpers/Const'
import { getTSFromEpochStamp, getDiffInSeconds } from '../../Helpers/Date'

class DelegateInfo extends Component {

  static propTypes = {
    delegateName: React.PropTypes.string,
  }

  constructor (props) {
    super(props)

    this.state = {
      firstFetchDone: false,
      lastFetchAt: 0,
      lastFetchAtHuman: '',

      // delegateName: props.delegateName,
      delegateName: 'doweig',

      delegateAddress: '',
      account: null,

      lastBlock: null,
      lastBlockAtHuman: '',

      nextForgerPosition: 0,
      nextBlockAtHuman: '',
    }
  }

  componentDidMount () {
    this.startDelegateInfoRefresher()
    this.startLastBlockTimeRefresher()
  }

  startLastBlockTimeRefresher = () => {
    setInterval(() => {
      if (!this.state.firstFetchDone) {
        return
      }

      this.refreshAtHuman()
    }, 1000)
  }

  refreshAtHuman = () => {
    const now = new Date
    this.setState({
      ...this.state,
      lastBlockTimeHuman: humanizeDuration(getDiffInSeconds(now, this.state.lastBlock.forgedAt)),
      nextBlockTimeHuman: humanizeDuration(getDiffInSeconds(
        now,
        this.state.lastBlock.forgedAt + (this.state.nextForgerPosition * CONST.BLOCKTIME_IN_SECONDS * 1000)
      )),
      lastFetchAtHuman: humanizeDuration(getDiffInSeconds(this.state.lastFetchAt, now)),
    })
  }

  startDelegateInfoRefresher = () => {
    return fetch('http://10.10.11.56:6040/api/getSearch?q=' + this.state.delegateName)
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          ...this.state,
          delegateAddress: responseJson.address,
        })

        setInterval(() => {
          this.getDelegateInfo(this.state.delegateAddress)
        }, 10 * 1000)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  getDelegateInfo = (delegateAddress) => {
    return fetch('http://10.10.11.56:6040/api/getAccount?address=' + delegateAddress)
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          ...this.state,
          account: responseJson,
        })
      })
      .then((responseJson) => fetch('http://10.10.11.56:6040/api/delegates/getLastBlocks?publicKey=' + this.state.account.publicKey))
      .then((response) => response.json())
      .then((responseJson) => {
        const { blocks } = responseJson
        let lastBlock = blocks[0]
        let forgedAt = getTSFromEpochStamp(lastBlock.timestamp)
        lastBlock.forgedAt = forgedAt
        this.setState({
          ...this.state,
          lastBlock: lastBlock,
        })
      })
      .then((responseJson) => fetch('http://10.10.11.56:6040/api/delegates/getNextForgers'))
      .then((response) => response.json())
      .then((responseJson) => {
        const { delegates } = responseJson
        this.setState({
          ...this.state,
          nextForgerPosition: delegates.indexOf(this.state.account.publicKey),
        })
        this.setState({
          ...this.state,
          firstFetchDone: true,
          lastFetchAt: new Date,
        })
        this.refreshAtHuman()
      })
      .catch((error) => {
        console.error(error)
      })
  }

  render() {
    const state = this.state
    
    if (!state.firstFetchDone) {
      return (
        <Screen>
          <Text>Loading...</Text>
        </Screen>
      )
    }

    return (
      <Screen>
        <NavigationBar title={state.delegateName} />
        <ScrollView>
          
          <Screen styleName="paper">

            {/* Debug helper */}
            <Row>
              <View>
                <Text style={{ fontSize: 10 }}>(Last time refreshed {state.lastFetchAtHuman} ago)</Text>
              </View>
            </Row>
            <Divider styleName="line" />

            {/* Forging section */}
            <Row>
              <View>
                <Title>Forging</Title>
              </View>
            </Row>
            <Row>
              <View>
                <Subtitle>Last forged block</Subtitle>
                <Text>{state.lastBlockTimeHuman} ago</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
              <Subtitle>Next forged block (estimation)</Subtitle>
                <Text>in {state.nextBlockTimeHuman}</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
                <Subtitle>Forged</Subtitle>
                <Text>{state.account.delegate.forged / 100000000} ARK</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
                <Subtitle>Productivity</Subtitle>
                <Text>{state.account.delegate.productivity} %</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
                <Subtitle>Missed Blocks</Subtitle>
                <Text>{state.account.delegate.missedblocks}</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
                <Subtitle>Produced Blocks</Subtitle>
                <Text>{state.account.delegate.producedblocks}</Text>
              </View>
            </Row>
            <Divider styleName="line" />

            {/* Popularity section */}
            <Row>
              <View>
                <Title>Popularity</Title>
              </View>
            </Row>
            <Row>
              <View>
                <Subtitle>Approval</Subtitle>
                <Text>{state.account.delegate.approval} %</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
                <Subtitle>Position</Subtitle>
                <Text>{state.account.delegate.rate} / {CONST.ACTIVE_DELEGATES}</Text>
              </View>
            </Row>
            <Divider styleName="line" />

            {/* Account section */}
            <Row>
              <View>
                <Title>Account</Title>
              </View>
            </Row>
            <Row>
              <View>
                <Subtitle>Delegate Name</Subtitle>
                <Text>{state.account.delegate.username}</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
                <Subtitle>Address</Subtitle>
                <Text>{state.account.delegate.address}</Text>
              </View>
            </Row>
            <Divider styleName="line" />
            <Row>
              <View>
                <Subtitle>Public Key</Subtitle>
                <Text>{state.account.delegate.publicKey}</Text>
              </View>
            </Row>
            <Divider styleName="line" />

          </Screen>

        </ScrollView>
      </Screen>
    )
    //     <ScrollView>
    //       <Image
    //         styleName="large-portrait hero"
    //         animationName="hero"
    //         source={{ uri: restaurant.image && restaurant.image.url }}
    //         key={restaurant.name}
    //       >
    //         <Tile animationName="hero">
    //           <Title>{restaurant.name}</Title>
    //           <Subtitle>{restaurant.address}</Subtitle>
    //         </Tile>
    //       </Image>

    //       <Screen styleName="paper">
    //         <Text styleName="md-gutter multiline">{restaurant.description}</Text>

    //         <Divider styleName="line" />

    //         <Row>
    //           <Icon name="laptop" />
    //           <View styleName="vertical">
    //             <Subtitle>Visit webpage</Subtitle>
    //             <Text numberOfLines={1}>{restaurant.url}</Text>
    //           </View>
    //           <Icon styleName="disclosure" name="right-arrow" />
    //         </Row>

    //         <Divider styleName="line" />

    //         <Row>
    //           <Icon name="pin" />
    //           <View styleName="vertical">
    //             <Subtitle>Address</Subtitle>
    //             <Text numberOfLines={1}>{restaurant.address}</Text>
    //           </View>
    //           <Icon styleName="disclosure" name="right-arrow" />
    //         </Row>

    //         <Divider styleName="line" />

    //         <Row>
    //           <Icon name="email" />
    //           <View styleName="vertical">
    //             <Subtitle>Email</Subtitle>
    //             <Text numberOfLines={1}>{restaurant.mail}</Text>
    //           </View>
    //         </Row>

    //         <Divider styleName="line" />
    //       </Screen>
    //     </ScrollView>
    //   </Screen>
    // )
  }
}

const mapStateToProps = (state) => {
  return {
    // delegateName: state.navigationState.routes[1].props.delegateName,
  }
}

// const mapDispatchToProps = {
//   onNavigateBack: navigatePop,
// }

export default connect(mapStateToProps, null)(DelegateInfo)
