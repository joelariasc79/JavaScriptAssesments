//this component will be used as cart root and have other child components like cartitem and cartsummary

import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import CartItemComponent from "./CartItemComponent";
import CartSummary from "./CartSummary";
import { saveCartForCheckout } from "../../State/Cart/CartAction";
import { useNavigate } from "react-router-dom";

let CartComponent = (props)=>{

    let user = useSelector((state)=>state.userReducer.user)
    let cartList = useSelector((state)=>state.cartReducer)

    let dispatchTheData = useDispatch();

    console.log("cartList", cartList)
    console.log("user", user._id)

    let goToCheckout = useNavigate();

    let clickToSaveCart =(cartList, userid)=>{
        if (userid) {
            alert("cart will be saved");
            dispatchTheData(saveCartForCheckout(cartList, userid))
        } else {
            alert("You're not logged-in!! Please login to help you in furture with your selected products!!")
            //add a function using navigation hook to re-direct to login page
        }
    }

    let calculateSummaryData = (cartItems)=>{
        let amount = 0, 
            count = 0;
    
        for(let item of cartItems) {
            amount += parseInt(item.qty) * parseInt(item.price);
            count  += parseInt(item.qty); 
        }
    
        return {
            amount, //ES6 syntactic sugar amount: amount //oject destructuring
            count // if key and values are same name then we can put it this way without ":"
        }
    }

    return(
        <div className="col-md-12">
            <h2>Cart Component</h2>

            { cartList && cartList.length > 0 ? 
              <>
              <table>
                  <thead>
                      <tr>
                          <th>Name</th>
                          <th>Price</th>
                          <th>Description</th>
                          <th>Rating</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          {
                              props.readOnly ?  "" : //bydefault false as boolean default is false
                                  <>
                                      <th>Remove</th>
                                      <th>Edit</th>
                                  </>
                          }
                      </tr>
                  </thead>
                  <tbody>
                      {
                        cartList.map((item)=>{
                                return <CartItemComponent item={item} key={item._id} readOnly={props.readOnly}/>
                        })
                    }
                </tbody>
            </table>
                    <CartSummary data={calculateSummaryData(cartList)} readOnly={props.readOnly} />

                    {
                        props.readOnly ? <></> : 
                            <>
                                <button onClick={() => clickToSaveCart(cartList, user._id)} >
                                            Save Cart
                                    </button>
                                <button onClick={()=>{goToCheckout("/checkout")}} >
                                    Go To Checkout
                                </button> 
                            </> 
                    }
                </> 
            :
            <h4>Please go to product and add item to cart!!!</h4>
            }
        </div>
    )
}

export default CartComponent;