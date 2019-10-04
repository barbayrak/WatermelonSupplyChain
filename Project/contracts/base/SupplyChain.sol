pragma solidity >=0.4.24;

import "../core/Ownable.sol";
import "../accessControl/RetailerRole.sol";
import "../accessControl/DistributorRole.sol";
import "../accessControl/FarmerRole.sol";
import "../accessControl/ConsumerRole.sol";

contract SupplyChain is Ownable, FarmerRole,RetailerRole,DistributorRole,ConsumerRole {

  address payable contractOwner;
  uint  upc;
  uint  sku;
  mapping (uint => Watermelon) watermelons;
  mapping (uint => string[]) watermelonsHistory;

  enum State {
    Harvested,
    Processed,
    Packed,
    ForSale,
    Sold,
    Shipped,
    Received,
    Purchased
  }

  State constant defaultState = State.Harvested;

  struct Watermelon {
    uint    sku;
    uint    upc;
    address ownerID;
    address payable originFarmerID;
    string  originFarmName;
    string  originFarmInformation;
    string  originFarmLatitude;
    string  originFarmLongitude;
    uint    productID;
    string productNotes;
    uint    productPrice;
    State   itemState;
    address distributorID;
    address payable retailerID;
    address consumerID;
  }

  event Harvested(uint upc);
  event Processed(uint upc);
  event Packed(uint upc);
  event ForSale(uint upc);
  event Sold(uint upc);
  event Shipped(uint upc);
  event Received(uint upc);
  event Purchased(uint upc);

  modifier onlyOwner() {
    require(msg.sender == contractOwner);
    _;
  }

  modifier verifyCaller (address _address) {
    require(msg.sender == _address);
    _;
  }

  modifier paidEnough(uint _price) {
    require(msg.value >= _price);
    _;
  }
  
  modifier checkValue(uint _upc) {
    _;
    uint _price = watermelons[_upc].productPrice;
    uint amountToReturn = msg.value - _price;
    msg.sender.transfer(amountToReturn);
  }

  modifier harvested(uint _upc) {
    require(watermelons[_upc].itemState == State.Harvested);
    _;
  }

  modifier processed(uint _upc) {
    require(watermelons[_upc].itemState == State.Processed);
    _;
  }
  
  modifier packed(uint _upc) {
    require(watermelons[_upc].itemState == State.Packed);
    _;
  }

  modifier forSale(uint _upc) {
    require(watermelons[_upc].itemState == State.ForSale);
    _;
  }

  modifier sold(uint _upc) {
    require(watermelons[_upc].itemState == State.Sold);
    _;
  }
  
  modifier shipped(uint _upc) {
    require(watermelons[_upc].itemState == State.Shipped);
    _;
  }

  modifier received(uint _upc) {
    require(watermelons[_upc].itemState == State.Received);
    _;
  }

  modifier purchased(uint _upc) {
    require(watermelons[_upc].itemState == State.Purchased);
    _;
  }

  constructor() public payable {
    contractOwner = msg.sender;
    sku = 1;
    upc = 1;
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }

  function harvestItem(
    uint _upc,
    address payable _originFarmerID,
    string memory _originFarmName,
    string memory _originFarmInformation,
    string memory _originFarmLatitude,
    string memory _originFarmLongitude,
    string memory _productNotes)
    public
    onlyFarmer()
  {
    watermelons[_upc] = Watermelon({
      sku: sku,
      upc: _upc,
      ownerID: msg.sender,
      originFarmerID: _originFarmerID,
      originFarmName: _originFarmName,
      originFarmInformation: _originFarmInformation,
      originFarmLatitude: _originFarmLatitude,
      originFarmLongitude: _originFarmLongitude,
      productID: sku + _upc,
      productPrice: 1000000000000000000,
      productNotes: _productNotes,
      itemState: State.Harvested,
      distributorID: address(0x0),
      retailerID: address(0x0),
      consumerID: address(0x0)
    });
    sku = sku + 1;
    emit Harvested(_upc);
  }

  function processItem(uint _upc) public
  onlyFarmer()
  harvested(_upc)
  verifyCaller(msg.sender)
  {
    watermelons[_upc].itemState = State.Processed;
    emit Processed(_upc);
  }

  function packItem(uint _upc) public
  onlyFarmer()
  processed(_upc)
  verifyCaller(msg.sender)
  {
    watermelons[_upc].itemState = State.Packed;
    emit Packed(_upc);
  }


  function sellItem(uint _upc, uint _price) public
  onlyFarmer()
  packed(_upc)
  verifyCaller(msg.sender)
  {
    watermelons[_upc].itemState = State.ForSale;
    watermelons[_upc].productPrice = _price;
    emit ForSale(_upc);
  }


  function buyItem(uint _upc) public payable
  onlyDistributor()
  forSale(_upc)
  paidEnough(watermelons[_upc].productPrice)
  checkValue(_upc)
  {
    watermelons[_upc].ownerID = msg.sender;
    watermelons[_upc].distributorID = msg.sender;
    watermelons[_upc].itemState = State.Sold;
    watermelons[_upc].originFarmerID.transfer(watermelons[_upc].productPrice);
    emit Sold(_upc);
  }

  function shipItem(uint _upc) public
  onlyDistributor()
  sold(_upc)
  verifyCaller(msg.sender)
  {
    watermelons[_upc].itemState = State.Shipped;
    emit Shipped(_upc);
  }

  function receiveItem(uint _upc) public
    onlyRetailer()
    shipped(_upc)
    verifyCaller(msg.sender)
  {
    watermelons[_upc].ownerID = msg.sender;
    watermelons[_upc].retailerID = msg.sender;
    watermelons[_upc].itemState = State.Received;
    emit Received(_upc);
  }


  function purchaseItem(uint _upc) public payable
    onlyConsumer()
    received(_upc)
    paidEnough(watermelons[_upc].productPrice)
    checkValue(_upc)
    {

    watermelons[_upc].ownerID = msg.sender;
    watermelons[_upc].consumerID = msg.sender;
    watermelons[_upc].itemState = State.Purchased;
    watermelons[_upc].retailerID.transfer(watermelons[_upc].productPrice);
    emit Purchased(_upc);

  }

  // Define a function 'fetchItemBufferOne' that fetches the data
  function fetchItemBufferOne(uint _upc) public view returns
  (
  uint    itemSKU,
  uint    itemUPC,
  address ownerID,
  address originFarmerID,
  string memory originFarmName,
  string memory originFarmInformation,
  string memory originFarmLatitude,
  string memory originFarmLongitude
  )
  {
  Watermelon memory item = watermelons[_upc];
  return
  (
  item.sku,
  item.upc,
  item.ownerID,
  item.originFarmerID,
  item.originFarmName,
  item.originFarmInformation,
  item.originFarmLatitude,
  item.originFarmLongitude
  );
  }

  // Define a function 'fetchItemBufferTwo' that fetches the data
  function fetchItemBufferTwo(uint _upc) public view returns
  (
  uint    itemSKU,
  uint    itemUPC,
  uint    productID,
  string memory productNotes,
  uint    productPrice,
  uint    itemState,
  address distributorID,
  address retailerID,
  address consumerID
  )
  {
  Watermelon memory item = watermelons[_upc];
  return
  (
  item.sku,
  item.upc,
  item.productID,
  item.productNotes,
  item.productPrice,
  uint(item.itemState),
  item.distributorID,
  item.retailerID,
  item.consumerID
  );
  }
}