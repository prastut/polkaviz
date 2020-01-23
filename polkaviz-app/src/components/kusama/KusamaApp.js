import React from 'react';
import { Stage, Layer, Text, Circle } from 'react-konva';
import { withRouter } from 'react-router-dom';
import { WsProvider, ApiPromise } from '@polkadot/api';
import Relay from '../Relay';
import KusamaValidator from './KusamaValidators';
import KusamaIntention from './KusamaIntentions';
import BlockAnimationNew from './BlockAnimation-new';
import Bottombar from '../Bottombar';

class KusamaApp extends React.Component {
  constructor() {
    super();
    this.latestBlockAuthor = undefined;
    this.state = {
      kusamavalidators: [],
      kusamalastAuthor: '',
      kusamastart: null,
      kusamaisloading: true,
      kusamavaltotalinfo: [],
      kusamabottombarinfo: {
        eraLength: 0,
        eraProgress: 0,
        sessionLength: 0,
        sessionProgress: 0,
      },
      kusamatotalValidators: 0,
      kusamafinalblock: 0,
      kusamaintentions: [],
      kusamavalidatorandintentions: [],
      kusamatotalIssued: '',
      ValidatorsData: [],
      IntentionsData: [],
    };
    this.ismounted = true;
  }

  componentDidMount() {
    // window.location.reload()
    this.createApi2();
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.state.kusamavalidators !== nextState.kusamavalidators ||
      this.state.kusamavalidatorandintentions !==
        nextState.kusamavalidatorandintentions ||
      this.state.kusamalastAuthor !== nextState.kusamalastAuthor ||
      this.state.kusamafinalblock !== nextState.kusamafinalblock ||
      this.state.kusamabottombarinfo !== nextState.kusamabottombarinfo ||
      this.state.kusamaisloading !== nextState.kusamaisloading
    )
      return true;
    return false;
  }

  async createApi2() {
    const provider = new WsProvider('wss://kusama-rpc.polkadot.io');
    const apinew = await ApiPromise.create({ provider });

    const balance = await apinew.query.balances.totalIssuance();
    console.log(balance.toString());
    const totalIssued = (balance.toString() / Math.pow(10, 18)).toFixed(3);
    if (this.ismounted) {
      this.setState({
        kusamatotalIssued: totalIssued,
      });
    }

    await apinew.derive.chain.subscribeNewHeads(block => {
      // console.log(`block #${block.author}`);
      const lastAuthor = block.author.toString();
      if (this.ismounted) {
        this.setState({ kusamalastAuthor: lastAuthor });
      }
      const start = new Date();
      const blockNumber = block.number.toString();
      if (this.ismounted) {
        this.setState({
          kusamastart: start,
          kusamafinalblock: blockNumber,
        });
      }
    });
    const totalValidators = await apinew.query.staking.validatorCount();
    // console.log("this", totalValidators.words["0"], totalValidators);
    if (this.ismounted) {
      this.setState({
        kusamatotalValidators: totalValidators.words['0'],
      });
    }

    await apinew.query.session.validators(validators => {
      // console.log(validators)
      const sessionValidators = validators.map(x => x.toString());
      // console.log(sessionValidators)
      if (this.ismounted) {
        this.setState({
          kusamavalidators: sessionValidators,
          kusamaisloading: false,
        });
      }
    });

    const start = async () => {
      let arr1 = [];
      // let arr2 = [];
      // const start = performance.now();
      try {
        const response = await fetch(
          'https://polka-analytic-api.herokuapp.com/validatorinfo',
        );
        const data = await response.json();
        arr1 = JSON.parse(JSON.stringify(data)).map(({ currentValidator }) => {
          // console.log(info);
          return {
            valname: currentValidator.accountId,
            valinfo: currentValidator,
          };
        });
      } catch (err) {
        console.log('err', err);
      }

      if (!(arr1.length > 0)) {
        const validatorstotalinfo = await Promise.all(
          this.state.kusamavalidators.map(val =>
            apinew.derive.staking.account(val),
          ),
        );

        console.log(JSON.parse(JSON.stringify(validatorstotalinfo)));
        // const intentionstotalinfo = await Promise.all(
        //   JSON.parse(JSON.stringify(intentions))[0].map(intention => apinew.derive.staking.info(intention))
        // )
        // console.log(JSON.parse(JSON.stringify(intentionstotalinfo)))

        arr1 = JSON.parse(JSON.stringify(validatorstotalinfo)).map(info => {
          // console.log(info);
          return {
            valname: info.accountId,
            valinfo: info,
          };
        });
      }

      // const end = performance.now();
      // console.log(`validator time ${end - start}`);

      this.setState({
        ValidatorsData: arr1,
      });
      // console.log(JSON.stringify(valinfo))
      let result = [];

      try {
        const response = await fetch(
          'https://polka-analytic-api.herokuapp.com/intentions',
        );
        const apiIntentions = await response.json();
        result = apiIntentions.intentions;
      } catch (err) {
        console.log('err', err);
      }
      console.log('result', result);
      if (!(result.length > 0)) {
        const intentions = await apinew.query.staking.validators();
        result = JSON.parse(JSON.stringify(intentions))[0];
      }
      // const intentions = await apinew.query.staking.validators();
      // const allvals = JSON.parse(JSON.stringify(intentions))[0];
      const allvals = result;
      // console.log(JSON.parse(JSON.stringify(intentions)));
      console.log(arr1);
      const arr2 = arr1.map(ele => ele.valname);
      const arr3 = allvals.filter(e => !arr2.includes(e));
      const intentionstotalinfo = await Promise.all(
        arr3.map(val => apinew.derive.staking.account(val)),
      );
      const arr4 = JSON.parse(JSON.stringify(intentionstotalinfo)).map(info => {
        return {
          valname: info.accountId,
          valinfo: info,
        };
      });
      console.log('Intentions data', arr4);
      console.log('Validators data', arr1);
      // let arr5 = this.state.validators.push(arr4);
      const arr5 = [...arr1, ...arr4];

      if (this.ismounted) {
        // console.log("arr1",arr1)
        this.setState(
          {
            kusamavaltotalinfo: arr1,
            kusamavalidatorandintentions: arr5,
            kusamaintentions: arr3,
            ValidatorsData: arr1,
            IntentionsData: arr4,
          },
          // () => this.getnominators2()
        );
      }
    };

    start();

    // console.log(intentions.toJSON())
    await apinew.derive.session.info(header => {
      // console.log(`eraLength #${header.eraLength}`);
      // console.log(`eraProgress #${header.eraProgress}`);
      // console.log(`sessionLength #${header.sessionLength}`);
      // console.log(`sessionProgress #${header.sessionProgress}`);
      const eraLength = header.eraLength.toString();
      const eraProgress = header.eraProgress.toString();
      const sessionLength = header.sessionLength.toString();
      const sessionProgress = header.sessionProgress.toString();
      // console.log(eraLength,eraProgress,sessionLength,sessionProgress)
      if (this.ismounted) {
        this.setState(
          {
            kusamabottombarinfo: {
              eraLength,
              eraProgress,
              sessionLength,
              sessionProgress,
            },
            kusamaisloading: false,
          },
          // () => this.createApi()
        );
      }
    });
  }

  // getnominators2 = async () => {
  //   let arr = [];
  //   // console.log("valtotal", this.state.valtotalinfo);
  //   this.state.kusamavaltotalinfo.forEach(ele => {
  //     console.log(ele);
  //     ele.valinfo.stakers.others.forEach(nom => {
  //       arr.push(nom.who);
  //     });
  //   });

  //   // console.log("here are unfiltered", arr);
  //   function onlyUnique(value, index, self) {
  //     return self.indexOf(value) === index;
  //   }

  //   let nominators = arr.filter(onlyUnique);
  //   // console.log("total", nominators);

  //   const nominatorstotalinfo = await Promise.all(
  //     nominators.map(val => this.state.apipromise.derive.staking.info(val))
  //   );

  //   let arr2 = JSON.parse(JSON.stringify(nominatorstotalinfo));
  //   this.setState({
  //     kusamanominatorinfo: arr2
  //   });
  // };
  componentWillUnmount() {
    this.ismounted = false;
  }

  handlePolkavizClick = () => {
    document.body.style.cursor = 'default';
    this.props.history.push({
      pathname: '/',
    });
  };

  render() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const { IntentionsData, ValidatorsData } = this.state;
    // console.table(this.state)
    // console.log(this.state.kusamavalidators,"vals")
    console.count('kusama rendered');
    let arr = this.state.kusamavalidators;
    if (this.state.kusamavalidatorandintentions.length !== 0) {
      arr = this.state.kusamavalidatorandintentions;
    }
    // console.log(arr,"arr")
    // const intentionsarr = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]
    const intentionsarr = this.state.kusamaintentions;
    const bottombarobject2 = {
      bottombarinfo: this.state.kusamabottombarinfo,
      finalblock: this.state.kusamafinalblock,
      validatorcount: this.state.kusamatotalValidators,
      totalIssued: `${this.state.kusamatotalIssued.toString()} M`,
    };
    // const validatortext = "Validators: " + this.state.validators.length + "/" + this.state.totalvalidators
    // const arr1 = [1,2,3,4,5,6,7,8]
    return this.state.ValidatorsData.length === 0 ? (
      <>
        <div className="lds-ripple">
          <div />
          <div />
        </div>
      </>
    ) : (
      <div className="kusamacontainer">
        {/* <div className="heading">
          <h2>Kusama Network</h2>
        </div> */}

        <div className="nav-path">
          <div className="nav-path-link" onClick={this.handlePolkavizClick}>
            Polkaviz
          </div>
          <div>/</div>
          <div className="nav-path-current">Kusama</div>
        </div>

        <div className="intentions">
          <div>Next Up:</div>
          {intentionsarr.map((ele, index) => {
            return (
              <div className="inten" key={index}>
                <span className="valsign" />
                {`${ele.toString().slice(0, 8)}......${ele
                  .toString()
                  .slice(-8)}`}
              </div>
            );
          })}
        </div>

        <div className="relay-circle">
          <Stage width={window.innerWidth} height={window.innerHeight}>
            <Layer>
              <Circle
                x={width - 348}
                y={height - 190}
                radius={10}
                fill="#FFEB3B"
              />
              <Text
                x={width - 325}
                y={height - 195}
                text="Intentions"
                fill={this.props.colorMode === 'light' ? '#1A202C' : '#718096'}
                fontSize={15}
              />
              <Circle
                x={width - 348}
                y={height - 160}
                radius={10}
                fill="#C31169"
              />
              <Text
                x={width - 325}
                y={height - 165}
                text="Validators"
                fill={this.props.colorMode === 'light' ? '#1A202C' : '#718096'}
                fontSize={15}
              />
              {/* <Parachains x={window.innerWidth} y={window.innerHeight} parachains={arr1}/> */}
              {/* in  (90 - 1) "-1"  is to handle the deviation of hexagon wrt to validators */}
              {ValidatorsData.map((person, index) => (
                <KusamaValidator
                  key={index}
                  validatorAddress={person.valname}
                  valinfo={person.valinfo}
                  totalinfo={this.state.kusamavaltotalinfo}
                  nominatorinfo={this.state.kusamanominatorinfo}
                  angle={180 - (index * 360) / ValidatorsData.length}
                  history={this.props.history}
                  intentions={intentionsarr}
                  x={
                    window.innerWidth +
                    360 *
                      Math.cos(
                        (90 - 1 - (index * 360) / ValidatorsData.length) *
                          0.0174533,
                      )
                  }
                  y={
                    window.innerHeight +
                    360 *
                      Math.sin(
                        (90 - 1 - (index * 360) / ValidatorsData.length) *
                          0.0174533,
                      )
                  }
                  isKusama
                />
              ))}
              {IntentionsData.map((person, index) => (
                <KusamaIntention
                  key={index}
                  validatorAddress={person.valname}
                  valinfo={person.valinfo}
                  totalinfo={this.state.kusamavaltotalinfo}
                  nominatorinfo={this.state.kusamanominatorinfo}
                  angle={180 - (index * 360) / IntentionsData.length}
                  history={this.props.history}
                  intentions={intentionsarr}
                  x={
                    window.innerWidth +
                    360 *
                      Math.cos(
                        (90 - 1 - (index * 360) / IntentionsData.length) *
                          0.0174533,
                      )
                  }
                  y={
                    window.innerHeight +
                    360 *
                      Math.sin(
                        (90 - 1 - (index * 360) / IntentionsData.length) *
                          0.0174533,
                      )
                  }
                  isKusama
                />
              ))}
              {/* {console.log(this.state.bottombarobject.finalblock)}
              {console.log(this.state.previousBlock)} */}
              <BlockAnimationNew
                key={this.state.kusamavalidators.indexOf(
                  this.state.kusamalastAuthor,
                )}
                angle={
                  180 -
                  (this.state.kusamavalidators.indexOf(
                    this.state.kusamalastAuthor,
                  ) *
                    360) /
                    arr.length
                }
                x1={
                  window.innerWidth / 2 +
                  100 *
                    Math.cos(
                      (90 -
                        (this.state.kusamavalidators.indexOf(
                          this.state.kusamalastAuthor,
                        ) *
                          360) /
                          arr.length) *
                        0.0174533,
                    )
                }
                y1={
                  window.innerHeight / 2 +
                  100 *
                    Math.sin(
                      (90 -
                        (this.state.kusamavalidators.indexOf(
                          this.state.kusamalastAuthor,
                        ) *
                          360) /
                          arr.length) *
                        0.0174533,
                    )
                }
                x2={
                  window.innerWidth / 2 +
                  160 *
                    Math.cos(
                      (90 -
                        (this.state.kusamavalidators.indexOf(
                          this.state.kusamalastAuthor,
                        ) *
                          360) /
                          arr.length) *
                        0.0174533,
                    )
                }
                y2={
                  window.innerHeight / 2 +
                  160 *
                    Math.sin(
                      (90 -
                        (this.state.kusamavalidators.indexOf(
                          this.state.kusamalastAuthor,
                        ) *
                          360) /
                          arr.length) *
                        0.0174533,
                    )
                }
              />
              <Relay x={window.innerWidth} y={window.innerHeight} isKusama />
            </Layer>
          </Stage>
        </div>
        <div className="bottombar">
          <Bottombar
            start={this.state.kusamastart}
            activevalidators={this.state.kusamavalidators.length}
            validatorcount={this.state.kusamavalidatorcount}
            bottombarobject={bottombarobject2}
            isKusama
          />
        </div>
      </div>
    );
  }
}

export default withRouter(KusamaApp);
