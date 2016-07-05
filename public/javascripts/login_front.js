
  //TO USE THESE FUNCTIONS: 
  //CREATE CLASSES 'input_blur' and 'input_selected' to stylize inputs accordingly
  function selectInput(obj, txt)
  {
	$(obj).addClass('input_selected'); 
	
	if ($(obj).hasClass('input_blur'))
		$(obj).removeClass('input_blur');
	
	if (obj.value == txt){
	if (obj.value == 'password' || obj.value == 'Enter a password' || obj.value == 'Confirm password')
		obj.type = "password";
	obj.value = "";  
	}
  }
  
  function deselectInput(obj, txt)
  {
	  $(obj).removeClass('input_selected');
	  if (obj.value == "")
	  {
		obj.value = txt;
		obj.type = "text";
		$(obj).addClass('input_blur');
	  }
  }