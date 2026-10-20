import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import colors from "@/constants/colors";

type Options={isKenya:boolean;mobileMoney:boolean;card:boolean;mobileMoneyReason?:string;cardReason?:string};
type Price={price?:string|number;cardPrice?:string|number};
export default function CardPurchaseScreen(){
 const {user}=useAuth();const router=useRouter();const [phone,setPhone]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const options=useQuery({queryKey:["card-payment-options",user?.id],queryFn:()=>api<Options>("/api/virtual-card/payment-options"),enabled:!!user});
 const price=useQuery({queryKey:["card-price"],queryFn:()=>api<Price>("/api/system-settings/card-price"),enabled:!!user});
 if(!user)return <Redirect href="/sign-in"/>;
 const buy=async(method:"mobile_money"|"card")=>{setBusy(true);setMessage("");try{const data=await api<{redirectUrl?:string;reference?:string;message?:string}>("/api/virtual-card/initialize-payment",{method:"POST",body:JSON.stringify({paymentMethod:method,...(phone?{phoneNumber:phone}:{})})});if(data.redirectUrl)await WebBrowser.openBrowserAsync(data.redirectUrl);setMessage(data.message||"Payment started. Your card activates only after the provider confirms payment.");}catch(e){setMessage(e instanceof Error?e.message:"Card purchase could not be started.");}finally{setBusy(false)}};
 return <SafeAreaView style={s.safe} edges={["top"]}><View style={s.page}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹  Back</Text></Pressable><Text style={s.title}>Get a virtual card</Text><Text style={s.sub}>Price: {price.data?.price??price.data?.cardPrice??"—"} USD. Payment and activation are confirmed by GreenPay’s server.</Text>{options.isLoading&&<ActivityIndicator color={colors.light.primary}/>}
 {options.isError&&<Text style={s.error}>Payment methods couldn’t load.</Text>}
 {options.data?.isKenya&&<><Text style={s.label}>M-Pesa phone (if different from your profile)</Text><TextInput style={s.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholder="07… or +254…"/><Button label="Buy with M-Pesa" disabled={busy||!options.data.mobileMoney} onPress={()=>void buy("mobile_money")}/>{!options.data.mobileMoney&&<Text style={s.note}>{options.data.mobileMoneyReason||"Mobile money is unavailable."}</Text>}</>}
 <Button label="Buy by card" disabled={busy||!options.data?.card} onPress={()=>void buy("card")}/>{!options.data?.card&&<Text style={s.note}>{options.data?.cardReason||"Card checkout is unavailable for this account."}</Text>}
 {busy&&<ActivityIndicator color={colors.light.primary}/>} {!!message&&<Text accessibilityRole="alert" style={s.note}>{message}</Text>}
 <View style={s.disclosure}><Text style={s.note}>No card is activated until GreenPay confirms the payment. Check your country’s availability and fees before proceeding.</Text></View></View></SafeAreaView>
}
function Button({label,disabled,onPress}:{label:string;disabled:boolean;onPress:()=>void}){return <Pressable disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.5}]}><Text style={s.buttonText}>{label}</Text></Pressable>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.light.background},page:{padding:20,gap:13},back:{color:colors.light.primary,fontWeight:"600"},title:{fontSize:27,fontWeight:"700",color:colors.light.foreground},sub:{fontSize:13,color:colors.light.mutedForeground,lineHeight:19},label:{fontSize:13,fontWeight:"600",color:colors.light.foreground},input:{height:50,borderWidth:1,borderColor:colors.light.border,borderRadius:13,backgroundColor:colors.light.card,paddingHorizontal:14,color:colors.light.foreground},button:{height:50,backgroundColor:colors.light.primary,borderRadius:14,alignItems:"center",justifyContent:"center"},buttonText:{color:colors.light.primaryForeground,fontWeight:"700"},note:{fontSize:12,color:colors.light.mutedForeground,lineHeight:18},error:{color:colors.light.destructive,fontSize:13},disclosure:{borderTopWidth:1,borderTopColor:colors.light.border,marginTop:10,paddingTop:14}});
