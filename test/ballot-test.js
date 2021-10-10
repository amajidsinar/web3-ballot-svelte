const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");


async function calculateBalance(provider, address) {
    var balance = await provider.getBalance(address)
    var balance = ethers.utils.formatEther(balance)
    return balance
}

describe("Ballot", () => {
    before(async () => {
        this.Ballot = await ethers.getContractFactory("Ballot")
        this.signers = await ethers.getSigners()
        this.alice = this.signers[0]
        this.bob = this.signers[1]
        this.carol = this.signers[2]
        this.provider = waffle.provider
    })

    beforeEach(async () => {
        this.ballot = await this.Ballot.deploy()
        await this.ballot.deployed()
    })

    it("should have correct initial balance", async() => {
        const aliceBalance = await calculateBalance(this.provider, this.alice.address)
        expect(aliceBalance).to.not.equal('10000.0')

        const bobBalance = await calculateBalance(this.provider, this.bob.address)
        expect(bobBalance).to.equal('10000.0')

        const carolBalance = await calculateBalance(this.provider, this.carol.address)
        expect(carolBalance).to.equal('10000.0')
    })

    it("enter ballot with 2 users", async() => {
        const validAmount = ethers.utils.parseEther('0.5')
        const invalidAmount = ethers.utils.parseEther('0.01')

        await expect(this.ballot.connect(this.bob).enterBallot({value: invalidAmount})).to.be.revertedWith(
            'BALLOT: Not enough ether in account')
        let ballotBalance = await calculateBalance(this.provider, this.ballot.address)
        expect(ballotBalance).to.equal('0.0')

        await expect(this.ballot.connect(this.carol).enterBallot({value: invalidAmount})).to.be.revertedWith(
            'BALLOT: Not enough ether in account')        
        ballotBalance = await calculateBalance(this.provider, this.ballot.address)
        expect(ballotBalance).to.equal('0.0')
        
        await this.ballot.connect(this.bob).enterBallot({value: validAmount})
        ballotBalance = await calculateBalance(this.provider, this.ballot.address)
        expect(ballotBalance).to.equal('0.5')
        

        await this.ballot.connect(this.carol).enterBallot({value: validAmount})
        ballotBalance = await calculateBalance(this.provider, this.ballot.address)
        expect(ballotBalance).to.equal('1.0')


        })
    
    
    it("calculate at stake", async() => {
        const validAmount = ethers.utils.parseEther('0.5')
        
        await this.ballot.connect(this.bob).enterBallot({value: validAmount})
        await this.ballot.connect(this.carol).enterBallot({value: validAmount})
        

        let atStake = await this.ballot.getAtStake()
        atStake = ethers.utils.formatEther(atStake)

        const ballotBalance = await calculateBalance(this.provider, this.ballot.address)

        expect(atStake).to.equal(ballotBalance)
    })

    it("pick winner", async() => {
        const validAmount = ethers.utils.parseEther('0.5')
        
        await this.ballot.connect(this.bob).enterBallot({value: validAmount})
        await this.ballot.connect(this.carol).enterBallot({value: validAmount})

        await expect(this.ballot.connect(this.bob).pickWinner()).to.be.revertedWith(
            'only manager can execute this function'
        )
        await expect(this.ballot.connect(this.carol).pickWinner()).to.be.revertedWith(
            'only manager can execute this function'
        )
        const winner = await this.ballot.connect(this.alice).pickWinner()

        const players = await this.ballot.getPlayers()
        expect(players.includes(winner)).to.be.true
    })

    it("reset ballot", async() => {
        const validAmount = ethers.utils.parseEther('0.5')
        
        await this.ballot.connect(this.bob).enterBallot({value: validAmount})
        let players = await this.ballot.getPlayers()
        expect(players).to.deep.equal([this.bob.address])

        await this.ballot.connect(this.carol).enterBallot({value: validAmount})
        players = await this.ballot.getPlayers()
        expect(players).to.deep.equal([this.bob.address, this.carol.address])

        await this.ballot.connect(this.alice).resetBallot()
        players = await this.ballot.getPlayers()
        expect(players).to.deep.equal([])
    })


})