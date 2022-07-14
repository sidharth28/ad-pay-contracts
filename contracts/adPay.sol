// SPDX-License-Identifier: No-license

pragma solidity 0.8.9;

import { AccessControlEnumerableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract Adpay is AccessControlEnumerableUpgradeable, PausableUpgradeable {
   
    bytes32 public constant ADVERTISER_ROLE = keccak256("ADVERTISER");
    bytes32 public constant ADVERTISER_ADMIN_ROLE = keccak256("ADVERTISER_ADMIN");
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER");
    bytes32 public constant PUBLISHER_ADMIN_ROLE = keccak256("PUBLISHER_ADMIN");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR");
    bytes32 public constant CREATOR_ADMIN_ROLE = keccak256("CREATOR_ADMIN");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping (address => uint256) accounts;

    struct Ad{
        address adCreator;
        uint256 creatorShare;
        uint256 minimumBidPrice;
        address adPublisher;  
        bool isSettled;
        bool isPublished;
    }

    struct Bid{
        uint256 dailyBudget;
        uint256 noOfDays;
        uint256 createdDate;
        address adBidder;
        bool isBid;
    }

    mapping (string => Ad) adMap;
    mapping (string => Bid[])  adBidMap;

    uint256 public PlatformShare ; 

    event AdPublished(string adID);
    event AdBid(string adID,address bidder);
    event AdSettled(string adID);


    // bytes32 public constant PAUSER_ROLE = keccak256("PLATFORM");

   function initialize() initializer external {

        _setRoleAdmin(ADVERTISER_ROLE, ADVERTISER_ADMIN_ROLE);
        _setupRole(ADVERTISER_ADMIN_ROLE, _msgSender());
        _setRoleAdmin(PUBLISHER_ROLE, PUBLISHER_ADMIN_ROLE);
        _setupRole(PUBLISHER_ADMIN_ROLE, _msgSender());
        _setRoleAdmin(CREATOR_ROLE, CREATOR_ADMIN_ROLE);
        _setupRole(CREATOR_ADMIN_ROLE, _msgSender());

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());

        PlatformShare = 10; // PlatformShare 10%

   }

    function adPublish(string memory adID,address adCreator,uint256 creatorShare,uint256 minimumBidPrice) external onlyRole(PUBLISHER_ROLE) whenNotPaused {
      require(!adMap[adID].isPublished,"AdId already exist");

      adMap[adID] = Ad({
          adCreator:adCreator,
          creatorShare:creatorShare,
          minimumBidPrice:minimumBidPrice,
          adPublisher:_msgSender(),
          isSettled:true,
          isPublished:true
      });

      emit AdPublished(adID);
      
    }
    //   function testoo(string memory adID, uint256 noOfDays)  external payable  returns(uint256)  {
    //     uint indexL = adBidMap[adID].length == 0 ? 0:adBidMap[adID].length - 1;
    //   return 0 ;
    // }

    function adBid(string memory adID, uint256 noOfDays) external payable onlyRole(ADVERTISER_ROLE) whenNotPaused {
      require(adMap[adID].isPublished,"Invalid Ad Id");
      require(adMap[adID].isSettled,"IAd is closed for biding");
      require(noOfDays > 0,"no of days cannot be 0, should be greater than 1");
      require(msg.value >= adMap[adID].minimumBidPrice,"amount should be greater than minimumBidPrice ");

       uint indexL = adBidMap[adID].length == 0 ? 0:adBidMap[adID].length - 1;

      require(indexL == 0 ? true :msg.value > adBidMap[adID][indexL].noOfDays * adBidMap[adID][indexL].dailyBudget,"The bid amount is less than last bid");

      adBidMap[adID].push(Bid({
           dailyBudget:msg.value/noOfDays,
           noOfDays:noOfDays,
           createdDate:block.timestamp,
           adBidder:_msgSender(),
           isBid:true
       }));

      emit AdBid(adID,_msgSender());
    }

    function adSettle(string memory adID) external  onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {

        uint indexL = adBidMap[adID].length == 0 ? 0:adBidMap[adID].length - 1;

        //creator settle
        accounts[adMap[adID].adCreator] += (adBidMap[adID][indexL].noOfDays * adBidMap[adID][indexL].dailyBudget * adMap[adID].creatorShare)/100;

        //publisher settle
        accounts[adMap[adID].adPublisher] += (adBidMap[adID][indexL].noOfDays * adBidMap[adID][indexL].dailyBudget * (100 - adMap[adID].creatorShare -  PlatformShare))/100;

        emit AdSettled(adID);
      
    }

    function getAd(string memory adID)  external view  returns(Ad memory)  {
      return adMap[adID];
    }

    function bidCount(string memory adID)  external view  returns(uint256)  {
      return adBidMap[adID].length;
    }

    function getHighestBid(string memory adID)  external view  returns(Bid memory)  {
      return adBidMap[adID][adBidMap[adID].length - 1];
    }

    function getBalance(address addr)  external view  returns(uint256)  {
      return accounts[addr];
    }

    function withdraw() external   whenNotPaused {
      uint amount = accounts[msg.sender];
      accounts[msg.sender] = 0;
      payable(msg.sender).transfer(amount);
    }


        
    function pause() external virtual onlyRole(PAUSER_ROLE) whenNotPaused {
        _pause();
    }

   
    function unpause() external virtual onlyRole(PAUSER_ROLE) whenPaused {
        _unpause();
    }

    


  
}
