import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, Platform, Pressable, useColorScheme, Appearance, ScrollView, Animated, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';

const Stack = createNativeStackNavigator();

function useThemeColors() {
  const scheme = Appearance.getColorScheme();
  return scheme === 'dark'
    ? {
        bg: '#181a20',
        card: '#23262f',
        text: '#fff',
        accent: '#4f8cff',
        border: '#333',
        muted: '#aaa',
      }
    : {
        bg: '#f6f6f6',
        card: '#fff',
        text: '#222',
        accent: '#4f8cff',
        border: '#e0eaff',
        muted: '#888',
      };
}

function AnaSayfa({ navigation }) {
  const [hatirlatmalar, setHatirlatmalar] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const colors = useThemeColors();
  const now = new Date();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [uyari, setUyari] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const data = await AsyncStorage.getItem('hatirlatmalar');
        let arr = data ? JSON.parse(data) : [];
        // Erteleme ve öncelik analizleri
        let oncelikli = arr.filter(h => h.oncelik === 'yüksek' && new Date(h.tarih) - now < 1000*60*60*3 && new Date(h.tarih) > now);
        if (oncelikli.length > 0) {
          setUyari('Önceliği yüksek ve yaklaşan hatırlatmaların var!');
        } else {
          setUyari(null);
        }
        setHatirlatmalar(arr);
      };
      fetchData();
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, [refresh])
  );

  const silHatirlatma = async (idx) => {
    const yeni = hatirlatmalar.filter((_, i) => i !== idx);
    await AsyncStorage.setItem('hatirlatmalar', JSON.stringify(yeni));
    setRefresh(r => !r);
  };

  const duzenleHatirlatma = (idx) => {
    navigation.navigate('HatirlatmaEkle', { duzenle: hatirlatmalar[idx], idx });
  };

  return (
    <View style={{flex:1, backgroundColor:colors.bg}}>
      <View style={{padding:24, paddingTop:48, backgroundColor:colors.accent, borderBottomLeftRadius:24, borderBottomRightRadius:24}}>
        <Text style={{fontSize:24, fontWeight:'bold', color:'#fff'}}>Akıllı Hatırlatma</Text>
        <Text style={{fontSize:16, color:'#e0eaff', marginTop:4}}>Gününü planla, hiçbir şeyi unutma!</Text>
        {uyari && (
          <View style={{backgroundColor:'#ffb300', padding:8, borderRadius:8, marginTop:12}}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>{uyari}</Text>
          </View>
        )}
      </View>
      <Animated.View style={{flex:1, alignItems:'center', marginTop:-32, opacity:fadeAnim}}>
        <View style={{width:'90%', minHeight:120, backgroundColor:colors.card, borderRadius:16, padding:16, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:8, elevation:3}}>
          <Text style={{fontWeight:'bold', fontSize:18, marginBottom:8, color:colors.text}}>Yaklaşan Hatırlatmalar</Text>
          <ScrollView style={{maxHeight:220}} showsVerticalScrollIndicator={false}>
            {hatirlatmalar.length === 0 ? (
              <View style={{alignItems:'center', marginTop:16}}>
                <MaterialIcons name="event-note" size={48} color={colors.muted} />
                <Text style={{color:colors.muted, marginTop:8}}>Henüz hatırlatma yok. Hemen ekle!</Text>
              </View>
            ) : (
              hatirlatmalar
                .sort((a, b) => new Date(a.tarih) - new Date(b.tarih))
                .map((h, i) => {
                  const kalanSaat = (new Date(h.tarih) - now) / (1000*60*60);
                  let renk = colors.card;
                  if (kalanSaat < 1 && kalanSaat > 0) renk = '#ffe0e0';
                  else if (kalanSaat < 6 && kalanSaat > 0) renk = '#fff5e0';
                  return (
                    <View key={i} style={{backgroundColor:renk, borderRadius:10, padding:10, marginBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
                      <View style={{flex:1}}>
                        <Text style={{fontWeight:'bold', color:colors.text}}>{h.baslik}</Text>
                        <Text numberOfLines={1} style={{color:colors.muted}}>{h.aciklama}</Text>
                        <Text style={{fontSize:12, color:colors.muted}}>{new Date(h.tarih).toLocaleString('tr-TR')}</Text>
                      </View>
                      <View style={{flexDirection:'row', gap:4}}>
                        <Pressable onPress={() => duzenleHatirlatma(i)} style={{marginRight:8}}>
                          <MaterialIcons name="edit" size={22} color={colors.accent} />
                        </Pressable>
                        <Pressable onPress={() => silHatirlatma(i)}>
                          <MaterialIcons name="delete" size={22} color="#d00" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
            )}
          </ScrollView>
        </View>
        <View style={{width:'90%', marginTop:24}}>
          <Button title="Tüm Hatırlatmalar" color={colors.accent} onPress={() => navigation.navigate('HatirlatmaEkle')} />
          <View style={{height:12}} />
          <Button title="Günlük Plan" color={colors.accent} onPress={() => navigation.navigate('GunlukPlan')} />
        </View>
      </Animated.View>
      <Pressable
        onPress={() => navigation.navigate('HatirlatmaEkle')}
        style={{position:'absolute', right:24, bottom:32, backgroundColor:colors.accent, borderRadius:32, width:56, height:56, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.15, shadowRadius:8, elevation:5}}
      >
        <MaterialIcons name="add" size={32} color="#fff" />
      </Pressable>
      <StatusBar style="auto" />
    </View>
  );
}

function HatirlatmaEkle({ navigation, route }) {
  const colors = useThemeColors();
  const [baslik, setBaslik] = useState(route?.params?.duzenle?.baslik || '');
  const [aciklama, setAciklama] = useState(route?.params?.duzenle?.aciklama || '');
  const [tarih, setTarih] = useState(route?.params?.duzenle?.tarih ? new Date(route.params.duzenle.tarih) : new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [snackbar, setSnackbar] = useState(false);
  const [duzenleme, setDuzenleme] = useState(!!route?.params?.duzenle);
  const [oneriler, setOneriler] = useState([]);
  const [oncelik, setOncelik] = useState(route?.params?.duzenle?.oncelik || 'normal');
  const [ertelemeSayisi, setErtelemeSayisi] = useState(route?.params?.duzenle?.ertelemeSayisi || 0);
  const [erteleUyari, setErteleUyari] = useState(false);

  useEffect(() => {
    const analiz = async () => {
      const data = await AsyncStorage.getItem('hatirlatmalar');
      if (data) {
        const arr = JSON.parse(data);
        const sayac = {};
        arr.forEach(h => {
          if (h.baslik) sayac[h.baslik] = (sayac[h.baslik] || 0) + 1;
        });
        const populer = Object.entries(sayac).filter(([b, s]) => s >= 3).map(([b]) => b);
        setOneriler(populer);
      }
    };
    analiz();
  }, []);

  useEffect(() => {
    if (ertelemeSayisi >= 2) setErteleUyari(true);
    else setErteleUyari(false);
  }, [ertelemeSayisi]);

  const onOneriTikla = (b) => {
    setBaslik(b);
    setAciklama('');
    setTarih(new Date());
  };

  const onChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setTarih(selectedDate);
  };

  const handleKaydet = async () => {
    const yeniHatirlatma = { baslik, aciklama, tarih, oncelik, ertelemeSayisi };
    const eski = await AsyncStorage.getItem('hatirlatmalar');
    let arr = eski ? JSON.parse(eski) : [];
    if (duzenleme && typeof route?.params?.idx === 'number') {
      arr[route.params.idx] = yeniHatirlatma;
    } else {
      arr.push(yeniHatirlatma);
    }
    await AsyncStorage.setItem('hatirlatmalar', JSON.stringify(arr));
    // Bildirim planla
    const now = new Date();
    if (tarih > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: baslik || 'Hatırlatma',
          body: aciklama || '',
        },
        trigger: tarih,
      });
    }
    setBaslik('');
    setAciklama('');
    setTarih(new Date());
    setSnackbar(true);
    setTimeout(() => {
      setSnackbar(false);
      navigation.goBack();
    }, 1200);
  };

  const ertele = async (saat) => {
    const yeniTarih = new Date(Date.now() + saat*60*60*1000);
    setTarih(yeniTarih);
    setErtelemeSayisi(ertelemeSayisi+1);
  };

  return (
    <View style={{flex:1, backgroundColor:colors.bg, alignItems:'center', justifyContent:'center'}}>
      <View style={{backgroundColor:colors.card, borderRadius:16, padding:24, width:'90%', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:8, elevation:3}}>
        <Text style={{fontWeight:'bold', fontSize:20, marginBottom:16, color:colors.accent}}>{duzenleme ? 'Hatırlatma Düzenle' : 'Hatırlatma Ekle'}</Text>
        {erteleUyari && (
          <View style={{backgroundColor:'#ffb300', padding:8, borderRadius:8, marginBottom:12}}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>Bu hatırlatmayı çok kez ertelediniz. Daha uygun bir zamana taşımak ister misiniz?</Text>
          </View>
        )}
        {oneriler.length > 0 && !duzenleme && (
          <View style={{marginBottom:12}}>
            <Text style={{color:colors.muted, marginBottom:4}}>Sık eklediğiniz:</Text>
            <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
              {oneriler.map((b, i) => (
                <Pressable key={i} onPress={() => onOneriTikla(b)} style={{backgroundColor:colors.accent, borderRadius:16, paddingHorizontal:12, paddingVertical:6, marginRight:8, marginBottom:8}}>
                  <Text style={{color:'#fff', fontWeight:'bold'}}>{b}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        <TextInput
          placeholder="Başlık"
          value={baslik}
          onChangeText={setBaslik}
          style={{borderWidth:1, borderColor:colors.border, width:'100%', padding:10, borderRadius:8, marginBottom:12, backgroundColor:colors.bg, color:colors.text}}
          placeholderTextColor={colors.muted}
        />
        <TextInput
          placeholder="Açıklama"
          value={aciklama}
          onChangeText={setAciklama}
          style={{borderWidth:1, borderColor:colors.border, width:'100%', padding:10, borderRadius:8, marginBottom:12, backgroundColor:colors.bg, color:colors.text}}
          multiline
          placeholderTextColor={colors.muted}
        />
        <View style={{flexDirection:'row', gap:8, marginBottom:12}}>
          <Text style={{color:colors.muted, marginTop:8}}>Öncelik:</Text>
          <Pressable onPress={()=>setOncelik('normal')} style={{backgroundColor:oncelik==='normal'?colors.accent:colors.border, borderRadius:12, paddingHorizontal:10, paddingVertical:4}}>
            <Text style={{color:oncelik==='normal'?'#fff':colors.text}}>Normal</Text>
          </Pressable>
          <Pressable onPress={()=>setOncelik('yüksek')} style={{backgroundColor:oncelik==='yüksek'?colors.accent:colors.border, borderRadius:12, paddingHorizontal:10, paddingVertical:4}}>
            <Text style={{color:oncelik==='yüksek'?'#fff':colors.text}}>Yüksek</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => setShowPicker(true)} style={{padding:12, backgroundColor:colors.border, borderRadius:8, marginBottom:12, flexDirection:'row', alignItems:'center', gap:8}}>
          <MaterialIcons name="event" size={20} color={colors.accent} />
          <Text style={{color:colors.accent}}>{tarih.toLocaleString('tr-TR')}</Text>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={tarih}
            mode="datetime"
            display="default"
            onChange={onChange}
          />
        )}
        <View style={{flexDirection:'row', gap:8, marginBottom:12}}>
          <Button title="1 Saat Ertele" color={colors.muted} onPress={()=>ertele(1)} />
          <Button title="3 Saat Ertele" color={colors.muted} onPress={()=>ertele(3)} />
        </View>
        <Button title={duzenleme ? 'Kaydet' : 'Ekle'} color={colors.accent} onPress={handleKaydet} />
      </View>
      {snackbar && (
        <View style={{position:'absolute', bottom:40, left:0, right:0, alignItems:'center'}}>
          <View style={{backgroundColor:colors.accent, padding:12, borderRadius:24, flexDirection:'row', alignItems:'center', gap:8}}>
            <MaterialIcons name="check-circle" size={20} color="#fff" />
            <Text style={{color:'#fff'}}>Kaydedildi!</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function GunlukPlan() {
  const [yapilacak, setYapilacak] = useState('');
  const [liste, setListe] = useState([]);
  const colors = useThemeColors();
  const fadeAnim = useState(new Animated.Value(0))[0];

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const data = await AsyncStorage.getItem('gunlukPlan');
        if (data) setListe(JSON.parse(data));
        else setListe([]);
      };
      fetchData();
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, [])
  );

  const ekle = async () => {
    if (!yapilacak.trim()) return;
    const yeni = { text: yapilacak, tamamlandi: false };
    const yeniListe = [...liste, yeni];
    setListe(yeniListe);
    await AsyncStorage.setItem('gunlukPlan', JSON.stringify(yeniListe));
    setYapilacak('');
  };

  const tamamla = async (idx) => {
    const yeniListe = liste.map((item, i) => i === idx ? { ...item, tamamlandi: !item.tamamlandi } : item);
    setListe(yeniListe);
    await AsyncStorage.setItem('gunlukPlan', JSON.stringify(yeniListe));
  };

  const sil = async (idx) => {
    const yeniListe = liste.filter((_, i) => i !== idx);
    setListe(yeniListe);
    await AsyncStorage.setItem('gunlukPlan', JSON.stringify(yeniListe));
  };

  const tamamlanan = liste.filter(i => i.tamamlandi).length;
  const yuzde = liste.length > 0 ? Math.round((tamamlanan / liste.length) * 100) : 0;

  return (
    <View style={{flex:1, backgroundColor:colors.bg, alignItems:'center', paddingTop:48}}>
      <Animated.View style={{backgroundColor:colors.card, borderRadius:16, padding:24, width:'90%', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:8, elevation:3, opacity:fadeAnim}}>
        <Text style={{fontWeight:'bold', fontSize:20, marginBottom:8, color:colors.accent}}>Günlük Plan</Text>
        <Text style={{color:colors.muted, marginBottom:16}}>{yuzde}% tamamlandı</Text>
        <View style={{flexDirection:'row', gap:8, marginBottom:16}}>
          <TextInput
            placeholder="Yapılacak ekle"
            value={yapilacak}
            onChangeText={setYapilacak}
            style={{borderWidth:1, borderColor:colors.border, padding:10, borderRadius:8, width:170, backgroundColor:colors.bg, color:colors.text}}
            placeholderTextColor={colors.muted}
          />
          <Button title="Ekle" color={colors.accent} onPress={ekle} />
        </View>
        <ScrollView style={{marginTop:8, width:'100%', maxHeight:260}} showsVerticalScrollIndicator={false}>
          {liste.length === 0 ? (
            <Text style={{color:colors.muted}}>Bugün için yapılacak yok.</Text>
          ) : (
            liste.map((item, i) => (
              <View key={i} style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderColor:colors.border}}>
                <Pressable onPress={() => tamamla(i)} style={{marginRight:8}}>
                  <MaterialIcons name={item.tamamlandi ? 'check-box' : 'check-box-outline-blank'} size={24} color={item.tamamlandi ? colors.accent : colors.muted} />
                </Pressable>
                <Text style={{flex:1, textDecorationLine: item.tamamlandi ? 'line-through' : 'none', color: item.tamamlandi ? colors.muted : colors.text, fontSize:16}}>{item.text}</Text>
                <Pressable onPress={() => sil(i)} style={{marginLeft:8}}>
                  <MaterialIcons name="delete" size={22} color="#d00" />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function Profil() {
  const colors = useThemeColors();
  const [modal, setModal] = useState(false);
  const [isim, setIsim] = useState('');
  const [soyisim, setSoyisim] = useState('');
  const [yas, setYas] = useState('');
  const [profilResmi, setProfilResmi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await AsyncStorage.getItem('profil');
      if (data) {
        const { isim, soyisim, yas, profilResmi } = JSON.parse(data);
        setIsim(isim || '');
        setSoyisim(soyisim || '');
        setYas(yas || '');
        setProfilResmi(profilResmi || null);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const kaydet = async () => {
    await AsyncStorage.setItem('profil', JSON.stringify({ isim, soyisim, yas, profilResmi }));
    setModal(false);
  };

  const resimSec = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Profil resmi seçmek için galeri izni vermelisiniz.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.5 });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilResmi(result.assets[0].uri);
    }
  };

  if (loading) return <View style={{flex:1, backgroundColor:colors.bg}} />;

  return (
    <View style={{flex:1, alignItems:'center', justifyContent:'center', backgroundColor:colors.bg}}>
      <TouchableOpacity onPress={() => setModal(true)} style={{alignItems:'center'}}>
        <View style={{borderWidth:3, borderColor:colors.accent, borderRadius:64, padding:4, backgroundColor:colors.card}}>
          {profilResmi ? (
            <Image source={{ uri: profilResmi }} style={{width:96, height:96, borderRadius:48}} />
          ) : (
            <MaterialIcons name="person" size={90} color={colors.accent} />
          )}
        </View>
        <Text style={{fontWeight:'bold', fontSize:20, marginTop:16, color:colors.text}}>{isim || 'İsim' } {soyisim || 'Soyisim'}</Text>
        <Text style={{color:colors.muted, marginTop:4}}>{yas ? `Yaş: ${yas}` : 'Yaş: -'}</Text>
        <Text style={{color:colors.accent, marginTop:16, fontWeight:'bold'}}>Profili Düzenle</Text>
      </TouchableOpacity>
      <Modal visible={modal} animationType="slide" transparent>
        <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center'}}>
          <View style={{backgroundColor:colors.card, borderRadius:20, padding:24, width:'85%', alignItems:'center'}}>
            <TouchableOpacity onPress={resimSec} style={{marginBottom:16}}>
              <View style={{borderWidth:2, borderColor:colors.accent, borderRadius:48, padding:2, backgroundColor:colors.bg}}>
                {profilResmi ? (
                  <Image source={{ uri: profilResmi }} style={{width:72, height:72, borderRadius:36}} />
                ) : (
                  <MaterialIcons name="person" size={64} color={colors.accent} />
                )}
                <View style={{position:'absolute', right:0, bottom:0, backgroundColor:colors.accent, borderRadius:12, padding:2}}>
                  <MaterialIcons name="edit" size={16} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
            <TextInput
              placeholder="İsim"
              value={isim}
              onChangeText={setIsim}
              style={{borderWidth:1, borderColor:colors.border, width:'100%', padding:10, borderRadius:8, marginBottom:10, backgroundColor:colors.bg, color:colors.text}}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Soyisim"
              value={soyisim}
              onChangeText={setSoyisim}
              style={{borderWidth:1, borderColor:colors.border, width:'100%', padding:10, borderRadius:8, marginBottom:10, backgroundColor:colors.bg, color:colors.text}}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Yaş"
              value={yas}
              onChangeText={setYas}
              keyboardType="numeric"
              style={{borderWidth:1, borderColor:colors.border, width:'100%', padding:10, borderRadius:8, marginBottom:16, backgroundColor:colors.bg, color:colors.text}}
              placeholderTextColor={colors.muted}
            />
            <View style={{flexDirection:'row', gap:12}}>
              <Button title="Kaydet" color={colors.accent} onPress={kaydet} />
              <Button title="İptal" color={colors.muted} onPress={() => setModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4f8cff',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: 64 },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'AnaSayfa') return <MaterialIcons name="home" size={size} color={color} />;
          if (route.name === 'GunlukPlan') return <MaterialIcons name="checklist" size={size} color={color} />;
          if (route.name === 'Profil') return <MaterialIcons name="person" size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 13, marginBottom: 6 },
      })}
    >
      <Tab.Screen name="AnaSayfa" component={AnaSayfa} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="GunlukPlan" component={GunlukPlan} options={{ title: 'Günlük Plan' }} />
      <Tab.Screen name="Profil" component={Profil} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TabNavigator" component={TabNavigator} />
        <Stack.Screen name="HatirlatmaEkle" component={HatirlatmaEkle} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
