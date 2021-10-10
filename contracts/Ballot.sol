pragma solidity ^0.8.0;

contract Ballot{
    address[] public players;
    mapping(address=>uint256) public balances;
    address public manager;
    uint256 money = 100;

    constructor () {
        manager = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == manager, "only manager can execute this function");
        _;
    }

    function enterBallot() public payable{
        require(msg.value > 0.01 ether, "BALLOT: Not enough ether in account");
        balances[msg.sender] += msg.value;
        players.push(msg.sender);
    }
    function random() private view returns(uint){
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }
    
    function pickWinner() public view restricted returns(address){
        uint random_number = random() % players.length;
        address winner =  players[random_number];
        return winner;
    }
    
    function distributeReward(address payable winner) public restricted{
        uint rewardAmount = address(this).balance;
        winner.transfer(rewardAmount);
    }
        
    function resetBallot() restricted public{
        players = new address[](0);
    }

    function getPlayers() public view returns(address[] memory){
        return players;
    }
    function getAtStake() public view returns(uint256){
        return address(this).balance;
    }
    
    
} 
    